// End-to-end smoke test with the locally installed Chrome (no browser download).
// Usage: node tests/e2e-smoke.mjs [baseUrl] [screenshotDir]
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

import http from "http";

// Pass a folder (e.g. "out") to serve a local static build in-process; otherwise a URL.
let BASE = (process.argv[2] || "https://lengkongandreuw.github.io/ielts-academy").replace(/\/$/, "");
let server;
if (!/^https?:/.test(BASE)) {
  const root = path.resolve(BASE);
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".mp3": "audio/mpeg" };
  server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(req.url.split("?")[0]));
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] ?? "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  BASE = `http://127.0.0.1:${server.address().port}`;
}
const SHOTS = process.argv[3] || "e2e-shots";
fs.mkdirSync(SHOTS, { recursive: true });
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message.split("\n")[0]}`);
    problems.push(`step ${name}: ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: path.join(SHOTS, `fail-${name.replace(/\W+/g, "_")}.png`) });
  }
};
const shot = (n) => page.screenshot({ path: path.join(SHOTS, `${n}.png`), fullPage: false });
const go = (p) => page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });

await step("landing", async () => {
  await go("/");
  await page.getByRole("heading", { name: /secara personal/ }).waitFor();
  await page.waitForTimeout(400);
  await shot("00-landing");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error("landing overflows on mobile");
  await page.screenshot({ path: path.join(SHOTS, "00-landing-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1366, height: 860 });
  await page.getByRole("link", { name: "Mulai Belajar" }).click();
  await page.waitForURL(/onboarding/);
});
await step("onboarding", async () => {
  await page.getByLabel("Nama panggilan").fill("Putra");
  await page.getByRole("button", { name: /Lanjut ke Diagnostic/ }).click();
  await page.waitForURL(/diagnostic/);
  await page.getByText("Grammar, Vocabulary & Reading").waitFor();
  await shot("01-diagnostic");
});
await step("diagnostic test", async () => {
  await page.getByRole("button", { name: "Mulai" }).first().click();
  await page.waitForURL(/test/);
  await page.getByText(/Content Unavailable/).first().waitFor();
  const total = await page.locator('nav[aria-label="Navigasi soal"] button').count();
  for (let i = 0; i < total; i++) {
    await page.locator('nav[aria-label="Navigasi soal"] button').nth(i).click();
    const q = page.locator('section[aria-label="Questions"]');
    const radios = q.locator('input[type="radio"]');
    if (await radios.count()) await radios.first().check({ force: true });
    else await q.getByPlaceholder("Ketik jawaban…").fill("cost");
  }
  await shot("02-test-question");
  await page.getByRole("button", { name: "Submit" }).first().click();
  await page.getByRole("button", { name: "Ya, kirim" }).click();
  await page.getByText("Skor mentah").waitFor();
  await page.getByText(/Level awal/).waitFor();
  await shot("03-test-result");
});
await step("diagnostic profile", async () => {
  await go("/diagnostic/");
  await page.getByText("Profil kemampuan awal").waitFor();
  await page.getByText(/Overall band belum ditampilkan/).waitFor();
});
await step("lesson day 1 complete", async () => {
  await go("/learn/W01D01/");
  await page.getByRole("heading", { name: "English Diagnostic" }).waitFor();
  for (let i = 0; i < 5 && (await page.getByRole("button", { name: "Next →" }).count()); i++) await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Complete Lesson" }).click();
  await page.getByText("Lesson selesai!").waitFor();
});
await step("lesson day 2 exercises", async () => {
  await go("/learn/W01D02/");
  await page.getByRole("heading", { name: /Sentence Structure/ }).first().waitFor();
  await shot("04-lesson-theory");
  for (let guard = 0; guard < 12; guard++) {
    const ex = page.locator("fieldset");
    const n = await ex.count();
    for (let i = 0; i < n; i++) {
      const f = ex.nth(i);
      for (let attempt = 0; attempt < 2; attempt++) {
        const btn = f.getByRole("button", { name: /Check Answer|Coba lagi/ });
        if (!(await btn.count())) break;
        const radios = f.locator('input[type="radio"]');
        if (await radios.count()) await radios.nth(attempt).check({ force: true });
        else await f.getByRole("textbox").fill("is");
        await btn.click();
        await page.waitForTimeout(100);
      }
    }
    const next = page.getByRole("button", { name: "Next →" });
    if (!(await next.count())) break;
    await next.click();
  }
  await shot("05-lesson-practice");
  await page.getByRole("button", { name: "Complete Lesson" }).click();
  await page.getByText(/Lesson selesai!|Needs Review/).first().waitFor();
});
await step("dashboard", async () => {
  await go("/dashboard/");
  await page.getByText("Today's Lesson").waitFor();
  await page.getByText(/Lv \d/).first().waitFor();
  await shot("06-dashboard");
});
await step("roadmap", async () => {
  await go("/learn/");
  await page.getByText("Perjalanan 112 Hari").waitFor();
  await shot("07-roadmap");
});
await step("reading practice", async () => {
  await go("/practice/reading/");
  await page.getByRole("button", { name: "Mulai" }).first().click();
  await page.waitForURL(/test/);
  await page.getByRole("button", { name: /Highlight/ }).waitFor();
  await shot("08-reading");
});
await step("writing self review", async () => {
  await go("/practice/writing/?type=paragraph");
  await page.getByRole("button", { name: "Tulis" }).first().click();
  await page.waitForURL(/edit/);
  await page.getByLabel("Esai Anda").fill("My hometown is a small city in West Java. However, it is famous for its cool weather and beautiful mountains. For example, many tourists visit the tea plantations every weekend. Moreover, the food is delicious and cheap, so students love living there.");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: /review mandiri/ }).click();
  await page.getByText("Checklist rubrik (Band 7)").waitFor();
  await page.getByText("Contoh jawaban model").first().waitFor();
  await shot("09-writing-review");
});
await step("daily challenge", async () => {
  await go("/challenge/");
  await page.getByRole("button", { name: "Mulai tantangan" }).click();
  await page.waitForURL(/test/);
  const total = await page.locator('nav[aria-label="Navigasi soal"] button').count();
  if (total !== 5) throw new Error(`expected 5 questions, got ${total}`);
  await page.getByRole("button", { name: "Submit" }).first().click();
  await page.getByRole("button", { name: "Ya, kirim" }).click();
  await page.getByText("Skor mentah").waitFor();
});
await step("listening unavailable", async () => {
  await go("/practice/listening/");
  await page.getByText(/Content Unavailable/).waitFor();
});
await step("tutor without key", async () => {
  await go("/tutor/");
  await page.getByText("AI Tutor belum aktif.").waitFor();
});
await step("settings backup", async () => {
  await go("/settings/");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Unduh backup/ }).click()]);
  const file = path.join(SHOTS, "backup.json");
  await dl.saveAs(file);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  if (j.app !== "ielts-academy" || j.data.settings.apiKey !== "") throw new Error("bad backup");
});
await step("persistence after reload", async () => {
  await go("/achievements/");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/Badges \(\d+\/19\)/).waitFor();
  await shot("10-achievements");
});
await step("mobile dashboard", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/dashboard/");
  await page.getByText("Today's Lesson").waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error("horizontal overflow on mobile");
  await shot("11-mobile-dashboard");
});
await step("dark mode", async () => {
  await page.setViewportSize({ width: 1366, height: 860 });
  await page.emulateMedia({ colorScheme: "dark" });
  await go("/dashboard/");
  await shot("12-dark-dashboard");
});

await browser.close();
server?.close();
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n- ${[...new Set(problems)].join("\n- ")}` : "\nNo console errors.");
process.exit(problems.some((p) => p.startsWith("step")) ? 1 : 0);
