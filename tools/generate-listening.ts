// Generates the listening MP3s with ElevenLabs text-to-speech, then rebuilds public/audio/listening.json.
// The API key is read from ELEVENLABS_API_KEY (stored in .env.local by `elevenlabs onboard`); it is never in code.
//
// Usage:
//   npx tsx tools/generate-listening.ts --dry          → show voice choices and character cost, no speech generated
//   npx tsx tools/generate-listening.ts                → generate every set whose MP3 does not exist yet
//   npx tsx tools/generate-listening.ts L-P1-sports-centre --force   → (re)generate selected sets
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { Readable } from "stream";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { LISTENING, charCount } from "../content/listening-scripts";
import { cleanMp3 } from "./mp3";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const MODEL = "eleven_v4";
const AUDIO = path.resolve("public/audio");
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const client = new ElevenLabsClient();

type Voice = { id: string; name: string; gender: string; accent: string };

/** Map role tags like "female-british" to the account's pre-made voices (labels: gender, accent). */
async function pickVoices(): Promise<Map<string, Voice>> {
  const res = await client.voices.getAll();
  const voices: Voice[] = res.voices
    .filter((v) => v.category === "premade")
    .map((v) => ({ id: v.voiceId, name: v.name ?? v.voiceId, gender: (v.labels?.gender ?? "").toLowerCase(), accent: (v.labels?.accent ?? "").toLowerCase() }));
  const tags = [...new Set(LISTENING.flatMap((s) => Object.values(s.speakers).map((sp) => sp.voice)))];
  const used = new Set<string>();
  const map = new Map<string, Voice>();
  for (const tag of tags) {
    const [gender, accent] = tag.split("-");
    const match =
      voices.find((v) => v.gender === gender && v.accent.includes(accent) && !used.has(v.id)) ??
      voices.find((v) => v.gender === gender && !used.has(v.id)) ??
      voices.find((v) => v.gender === gender);
    if (!match) throw new Error(`No pre-made voice found for ${tag}`);
    used.add(match.id);
    map.set(tag, match);
  }
  return map;
}

async function toBuffer(stream: ReadableStream<Uint8Array>) {
  const chunks: Buffer[] = [];
  for await (const c of Readable.fromWeb(stream as import("stream/web").ReadableStream<Uint8Array>)) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

async function main() {
  const voices = await pickVoices();
  console.log("Voices:");
  for (const [tag, v] of voices) console.log(`  ${tag.padEnd(18)} → ${v.name} (${v.gender}, ${v.accent || "accent n/a"})`);

  const todo = LISTENING.filter((s) => (only.length ? only.includes(s.id) : true)).filter((s) => force || !fs.existsSync(path.join(AUDIO, s.file)));
  const chars = todo.reduce((a, s) => a + charCount(s), 0);
  console.log(`\n${todo.length} set(s) to generate, ~${chars} characters with ${MODEL}.`);
  if (dry || todo.length === 0) return;

  fs.mkdirSync(AUDIO, { recursive: true });
  for (const s of todo) {
    process.stdout.write(`${s.id}: `);
    const parts: Buffer[] = [];
    for (const [i, [speaker, text]] of s.lines.entries()) {
      const voice = voices.get(s.speakers[speaker].voice)!;
      // Neighbouring lines give the model context, so intonation flows naturally across turns.
      const audio = await client.textToSpeech.convert(voice.id, {
        text,
        modelId: MODEL,
        outputFormat: "mp3_44100_128",
        previousText: i > 0 ? s.lines[i - 1][1] : undefined,
        nextText: i < s.lines.length - 1 ? s.lines[i + 1][1] : undefined,
      });
      parts.push(cleanMp3(await toBuffer(audio)));
      process.stdout.write(".");
    }
    // Clips are cleaned of per-clip Xing/Info headers, so the joined file reports its true length.
    fs.writeFileSync(path.join(AUDIO, s.file), Buffer.concat(parts));
    console.log(` ✓ ${s.file} (${Math.round(Buffer.concat(parts).length / 1024)} KB)`);
  }

  execFileSync(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), "tools/build-listening.ts"], { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
