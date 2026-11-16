// Builds public/audio/listening.json from content/listening-scripts.ts.
// Only sets whose MP3 exists in public/audio/ are published (no audio → Content Unavailable).
//
// Dialogue sets can be produced as one clip per line: put them in audio-src/<set id>/NN.mp3
// (NN = line number, 01, 02, …). This script joins them into public/audio/<file>.
//
// Usage:  npx tsx tools/build-listening.ts            → build manifest (+ join clips)
//         npx tsx tools/build-listening.ts --scripts  → export paste-ready texts to audio-src/scripts/
import fs from "fs";
import path from "path";
import { LISTENING, transcriptOf, charCount } from "../content/listening-scripts";
import { cleanMp3, mp3Duration } from "./mp3";

const AUDIO = path.resolve("public/audio");
const SRC = path.resolve("audio-src");

if (process.argv.includes("--scripts")) {
  fs.mkdirSync(path.join(SRC, "scripts"), { recursive: true });
  let total = 0;
  for (const s of LISTENING) {
    const lines = s.lines.map(([k, t], i) => `${String(i + 1).padStart(2, "0")} [${s.speakers[k].name} · ${s.speakers[k].voice}] ${t}`);
    fs.writeFileSync(path.join(SRC, "scripts", `${s.id}.txt`), `${s.title} (${s.file})\n\n${lines.join("\n")}\n`);
    total += charCount(s);
    console.log(`${s.id.padEnd(24)} ${String(s.lines.length).padStart(2)} lines  ${String(charCount(s)).padStart(5)} chars  voices: ${[...new Set(Object.values(s.speakers).map((v) => v.voice))].join(", ")}`);
  }
  console.log(`TOTAL ${total} characters`);
  process.exit(0);
}

const sets = [];
for (const s of LISTENING) {
  const out = path.join(AUDIO, s.file);
  const clipDir = path.join(SRC, s.id);
  if (fs.existsSync(clipDir)) {
    const clips = fs.readdirSync(clipDir).filter((f) => /^\d+\.mp3$/.test(f)).sort();
    if (clips.length === s.lines.length) {
      fs.writeFileSync(out, Buffer.concat(clips.map((c) => cleanMp3(fs.readFileSync(path.join(clipDir, c))))));
      console.log(`joined ${clips.length} clips → ${s.file}`);
    } else if (clips.length) {
      console.log(`! ${s.id}: ${clips.length}/${s.lines.length} clips — not joined yet`);
    }
  }
  if (!fs.existsSync(out)) {
    console.log(`- ${s.id}: no audio yet (skipped)`);
    continue;
  }
  // Remove any Xing/Info headers left inside the file (they make browsers show a wrong duration).
  const raw = fs.readFileSync(out);
  const clean = cleanMp3(raw);
  if (clean.length !== raw.length) {
    fs.writeFileSync(out, clean);
    console.log(`  cleaned headers in ${s.file}`);
  }
  const bytes = clean.length;
  sets.push({
    id: s.id,
    title: s.title,
    description: s.description,
    section: s.section,
    file: s.file,
    usage: s.usage,
    difficulty: s.section <= 2 ? 2 : 3,
    durationSec: mp3Duration(clean),
    transcript: transcriptOf(s),
    questions: s.questions,
  });
  console.log(`✓ ${s.id} (${Math.round(bytes / 1024)} KB)`);
}
fs.writeFileSync(path.join(AUDIO, "listening.json"), JSON.stringify({ sets }, null, 2) + "\n");
console.log(`listening.json: ${sets.length} set(s)`);
