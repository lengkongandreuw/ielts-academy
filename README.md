# IELTS Academy

Platform belajar mandiri **IELTS Academic** menuju Band 7.0 — dalam bahasa Indonesia, gratis, tanpa akun dan tanpa database online. Berjalan sepenuhnya di browser dan di-hosting di **GitHub Pages**.

## Fitur

- **Onboarding & Diagnostic Test** — grammar/vocabulary A1→C1, reading, writing paragraf (+ Task 2 opsional), speaking (opsional). Skill yang belum dinilai ditampilkan *Not Assessed*.
- **Kurikulum 112 hari / 16 minggu** dalam 4 fase. Lesson terbuka bertahap. Alurnya: Learn → Example → Guided Practice → Independent Practice → Feedback → Review.
- **Adaptif** — alokasi waktu per skill mengikuti selisih dari target, ada remedial dari kesalahan berulang, dan lesson dengan skor < 70% ditandai *Needs Review*.
- **Latihan IELTS** — Reading (passage di kiri, soal di kanan, timer, highlight, bukti jawaban), Listening (mode belajar/ujian), Writing (timer, autosave, revisi, perbandingan versi, contoh jawaban model), Speaking (rekam, transkrip otomatis, timer persiapan), Mini & Full Mock Test.
- **Error Log** — kesalahan dicatat, yang berulang ditandai, dan berstatus *resolved* setelah 3 jawaban benar berturut-turut.
- **Gamifikasi ringan** — XP, level, streak, 19 badge, Daily Challenge, flashcard kosakata (spaced repetition 1-3-7-14-30 hari).
- **AI opsional** — AI Tutor (5 mode) serta evaluasi Writing & Speaking berbasis rubrik memakai **API key Claude milik pengguna sendiri**. Key hanya disimpan di browser pengguna.
- **Jujur soal skor** — semua estimasi diberi label non-resmi. Overall band hanya muncul bila keempat skill sudah dinilai. Pronunciation tidak diberi skor karena butuh analisis audio.

## Penyimpanan data

Semua progres tersimpan di **IndexedDB browser** perangkat pengguna. Gunakan **Settings → Backup** untuk mengunduh atau memulihkan progres (pindah perangkat). Rekaman audio tidak ikut dalam backup, dan API key tidak pernah ikut dalam backup.

## Menjalankan di komputer

```bash
npm install
npm run dev        # http://localhost:3300
npm test           # unit test (scoring, adaptif, engine, konten)
npm run build      # static export ke folder out/
```

## Deploy ke GitHub Pages

Setiap push ke branch `main` otomatis menjalankan test, build, lalu deploy lewat `.github/workflows/deploy.yml`. Pengaturan repo: **Settings → Pages → Source: GitHub Actions**.

## Menambahkan audio Listening

1. Salin file audio (MP3/WAV/M4A, maks 100 MB per file) ke `public/audio/`.
2. Tambahkan set soal di `public/audio/listening.json`. Lihat contoh lengkap di `public/audio/listening.example.json`.
   - `usage`: `"practice"` (Listening Practice), `"diagnostic"` (Diagnostic Test), atau `"mock"` (Full Mock, hingga 4 set).
   - `type` soal: `mcq` (answer = indeks opsi, mulai 0), `tfng`/`ynng` (answer = `"TRUE"`/`"FALSE"`/`"NOT GIVEN"` atau `"YES"`/`"NO"`/`"NOT GIVEN"`), `completion`/`short` (answer = daftar jawaban yang diterima).
3. Commit dan push. Selama `listening.json` kosong, Listening tampil sebagai *Content Unavailable* dan tidak dinilai.

> Catatan: karena situs ini statis, file audio dan kunci jawaban bisa diakses publik. Gunakan hanya audio yang Anda buat sendiri atau yang Anda punya izin untuk dipublikasikan.

## Mengubah konten

Semua materi ditulis sendiri untuk platform ini dan tersimpan di folder `content/`:

| File | Isi |
|---|---|
| `content/topics-grammar.ts` | Topik grammar (penjelasan, contoh, kesalahan umum, latihan) |
| `content/topics-skills.ts` | Vocabulary, strategi Reading/Listening/Writing/Speaking |
| `content/curriculum.ts` | Urutan 16 minggu × 7 hari |
| `content/bank.ts` | Soal diagnostic, passage reading, soal writing & speaking, rubrik |
| `content/vocabulary.ts` | Kosakata + collocation |
| `content/model-answers.ts` | Contoh jawaban writing |

Format latihan: `[soal, opsi[], jawaban, penjelasan]`. Jawaban berupa indeks opsi, atau daftar jawaban yang diterima bila `opsi` kosong. Setelah mengubah konten, jalankan `npm test`: test akan memeriksa bahwa setiap kunci jawaban valid dan setiap kutipan bukti benar-benar ada di passage.

Hasil tes lama tidak berubah saat konten diubah, karena setiap sesi menyimpan salinan soal yang dikerjakan.

## Teknologi

Next.js 15 (static export) · TypeScript · Tailwind CSS 4 · immer · IndexedDB · Anthropic SDK (browser, opsional) · Vitest.

---

IELTS Academy tidak berafiliasi dengan penyelenggara IELTS. Semua estimasi skor bersifat simulasi dan bukan skor IELTS resmi.
