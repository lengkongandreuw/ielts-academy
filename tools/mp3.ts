// Minimal MP3 helpers for joining ElevenLabs clips.
// Each clip starts with a Xing/Info frame that states that clip's own length; if it is kept in a joined file,
// browsers read the first one and report the wrong duration (e.g. 3 s for a 2-minute file) and seeking breaks.
// cleanMp3 removes ID3 tags and Xing/Info/VBRI frames, keeping only audio frames.

const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

function frameLength(b: Buffer, i: number): number {
  if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) return 0;
  const version = (b[i + 1] >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
  const layer = (b[i + 1] >> 1) & 3; // 1 = Layer III
  if (version === 1 || layer !== 1) return 0;
  const br = (version === 3 ? BITRATES_V1_L3 : BITRATES_V2_L3)[(b[i + 2] >> 4) & 15] * 1000;
  const sr = RATES[version]?.[(b[i + 2] >> 2) & 3];
  if (!br || !sr) return 0;
  const pad = (b[i + 2] >> 1) & 1;
  return Math.floor(((version === 3 ? 144 : 72) * br) / sr) + pad;
}

export function cleanMp3(buf: Buffer): Buffer {
  const out: Buffer[] = [];
  let i = 0;
  while (i < buf.length - 4) {
    // ID3v2 tag
    if (buf.toString("latin1", i, i + 3) === "ID3") {
      const size = ((buf[i + 6] & 0x7f) << 21) | ((buf[i + 7] & 0x7f) << 14) | ((buf[i + 8] & 0x7f) << 7) | (buf[i + 9] & 0x7f);
      i += 10 + size;
      continue;
    }
    // ID3v1 tag
    if (buf.toString("latin1", i, i + 3) === "TAG" && i + 128 <= buf.length) {
      i += 128;
      continue;
    }
    const len = frameLength(buf, i);
    if (!len) {
      i++;
      continue;
    }
    const head = buf.toString("latin1", i + 4, Math.min(i + 48, buf.length));
    const isInfo = head.includes("Xing") || head.includes("Info") || head.includes("VBRI");
    if (!isInfo) out.push(buf.subarray(i, i + len));
    i += len;
  }
  return Buffer.concat(out);
}

/** Duration in seconds from the audio frames (constant bitrate). */
export function mp3Duration(buf: Buffer): number {
  let i = 0;
  let sec = 0;
  while (i < buf.length - 4) {
    const len = frameLength(buf, i);
    if (!len) {
      i++;
      continue;
    }
    const version = (buf[i + 1] >> 3) & 3;
    const sr = RATES[version][(buf[i + 2] >> 2) & 3];
    sec += (version === 3 ? 1152 : 576) / sr;
    i += len;
  }
  return Math.round(sec);
}
