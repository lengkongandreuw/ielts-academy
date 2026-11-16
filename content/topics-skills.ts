import type { Topic } from "./types";
import { VOCAB } from "./vocabulary";

const vocabTopic = (tag: string, name: string, cefr: string, exercises: Topic["exercises"]): Topic => ({
  tag: `vocab-${tag}`,
  title: `Vocabulary: ${name}`,
  skill: "vocabulary",
  cefr,
  minutes: 60,
  objectives: [`Mempelajari 10 kata/frasa topik ${name}`, "Memahami collocation (kata yang biasa berpasangan)", "Memakai kosakata dalam kalimat sendiri"],
  explain:
    `Penguji IELTS menilai **Lexical Resource** dari ketepatan dan kealamian kata, bukan dari kata yang paling sulit. Karena itu, pelajari kata **bersama collocation**-nya — misalnya *reduce emissions*, bukan *decrease emissions* saja.\n\nKata-kata topik ${name} di bawah otomatis masuk ke bank kosakata pribadi Anda dan akan muncul di jadwal review (1, 3, 7, 14, 30 hari).`,
  examples: VOCAB[tag].slice(0, 4).map((v) => [v[3], `${v[0]} — ${v[2]}`]),
  tip: "Tulis satu kalimat tentang hidup Anda sendiri untuk setiap kata baru. Kalimat personal lebih mudah diingat.",
  exercises,
  vocab: VOCAB[tag].map((v) => v[0]),
  task: { kind: "vocab", body: "Buka Review Kosakata untuk melatih kata-kata ini dengan flashcard." },
});

export const SKILL_TOPICS: Topic[] = [
  // ───────── Vocabulary ─────────
  vocabTopic("education", "Education", "B1", [
    ["Many students ___ in online courses every year.", ["enrol", "acquire", "drop"], 0, "enrol in a course."],
    ["Learning Japanese helped me ___ new skills.", ["enrol", "acquire", "drop out"], 1, "acquire skills."],
    ["English is a ___ subject in most schools.", ["vocational", "compulsory", "critical"], 1, "compulsory subject = wajib."],
    ["Rising ___ make university unaffordable for some.", ["tuition fees", "curriculum", "literacy"], 0, "tuition fees = biaya kuliah."],
    ["Complete: Some students ___ ___ of school to support their families.", [], ["drop out"], "drop out of school."],
  ]),
  vocabTopic("environment", "Environment", "B1", [
    ["Factories must cut carbon ___.", ["habitats", "emissions", "conservation"], 1, "cut emissions."],
    ["Wind and solar are ___ energy sources.", ["renewable", "fossil", "obsolete"], 0, "renewable energy."],
    ["Building new roads can destroy natural ___.", ["pollutants", "habitats", "fuels"], 1, "natural habitat."],
    ["Trees can help ___ the effects of flooding.", ["mitigate", "consume", "dispose"], 0, "mitigate the effects."],
    ["Complete: We need ___ development that protects future generations.", [], ["sustainable"], "sustainable development."],
  ]),
  vocabTopic("technology", "Technology", "B1", [
    ["Many people ___ smartphones for directions.", ["rely on", "access", "invade"], 0, "rely on."],
    ["Typewriters are now almost ___.", ["user-friendly", "obsolete", "innovative"], 1, "obsolete = usang."],
    ["Social media can invade users' ___.", ["privacy", "device", "automation"], 0, "invade privacy."],
    ["The discovery was a major ___ in medicine.", ["breakthrough", "access", "device"], 0, "major breakthrough."],
    ["Complete: Rural communities often lack ___ to the internet.", [], ["access"], "access to."],
  ]),
  vocabTopic("health", "Health", "B2", [
    ["Office workers often have a ___ lifestyle.", ["sedentary", "preventive", "sufficient"], 0, "sedentary lifestyle."],
    ["Childhood ___ is linked to sugary drinks.", ["epidemic", "obesity", "treatment"], 1, "childhood obesity."],
    ["Vaccination is a form of ___ healthcare.", ["preventive", "sedentary", "balanced"], 0, "preventive care."],
    ["Most adults need ___ sleep to stay healthy.", ["sufficient", "sedentary", "obese"], 0, "sufficient sleep."],
    ["Complete: Average life ___ has increased over the past century.", [], ["expectancy"], "life expectancy."],
  ]),
  vocabTopic("work", "Work & Economy", "B1", [
    ["Youth ___ is a serious problem in many countries.", ["income", "unemployment", "workforce"], 1, "youth unemployment."],
    ["Flexible hours can improve job ___.", ["satisfaction", "productivity", "economy"], 0, "job satisfaction."],
    ["Companies should ___ in staff training.", ["promote", "invest", "consume"], 1, "invest in."],
    ["Long working hours damage work-life ___.", ["balance", "income", "economy"], 0, "work-life balance."],
    ["Complete: Tourism helps to boost the local ___.", [], ["economy"], "boost the economy."],
  ]),
  vocabTopic("academic", "Academic & Data Language", "B2", [
    ["Prices ___ between 2010 and 2015, rising and falling repeatedly.", ["peaked", "fluctuated", "declined"], 1, "fluctuate = naik-turun."],
    ["Electricity use ___ at 8 pm and then fell.", ["peaked", "fluctuated", "contributed"], 0, "peak at."],
    ["A large ___ of residents use public transport.", ["proportion", "phenomenon", "peak"], 0, "a large proportion of."],
    ["There was a ___ increase in sales (very large).", ["significant", "approximately", "inevitable"], 0, "significant increase."],
    ["Complete: Many factors ___ ___ climate change.", [], ["contribute to"], "contribute to."],
  ]),
  {
    tag: "paraphrasing",
    title: "Paraphrasing for IELTS",
    skill: "vocabulary",
    cefr: "B2",
    minutes: 75,
    objectives: ["Paraphrase dengan sinonim, perubahan word form, dan struktur", "Menulis ulang soal Task 1/Task 2 di introduction", "Mengenali paraphrase di Reading dan Listening"],
    explain:
      "Paraphrase adalah keterampilan inti IELTS: di Reading/Listening, jawaban hampir selalu ditulis dengan kata **berbeda** dari soal; di Writing, introduction harus memparafrasekan soal.\n\nTiga teknik: (1) **sinonim** (shows → illustrates), (2) **ubah word form** (increase → an increase, popular → popularity), (3) **ubah struktur** (aktif ↔ pasif, klausa → noun phrase).\n\nJangan mengganti setiap kata — sinonim yang dipaksakan sering mengubah makna.",
    examples: [
      ["The chart shows… → The bar chart illustrates…", "Sinonim"],
      ["Many people believe… → It is widely believed that…", "Struktur"],
      ["Crime has increased. → There has been an increase in crime.", "Word form"],
    ],
    mistakes: [["The graph shows the number of births. → The graph shows the figure of births.", "…illustrates how many babies were born.", "'figure of births' tidak alami."]],
    exercises: [
      ["Best paraphrase of 'Many people think that…'", ["Lots of person think…", "It is widely believed that…", "Many peoples thinks…"], 1, "Ubah struktur, tetap akurat."],
      ["Best paraphrase of 'The number of cars increased.'", ["There was a rise in the number of cars.", "The cars number grew up.", "The amount of cars increased."], 0, "Word form + tetap akurat."],
      ["In Reading, the question says 'decreased'. Which word in the passage most likely matches?", ["declined", "doubled", "stabilised"], 0, "declined = decreased."],
      ["Paraphrase 'young people' (academic):", ["youngsters guys", "the younger generation", "small people"], 1, "the younger generation."],
    ],
  },

  // ───────── Reading ─────────
  {
    tag: "reading-skim-scan",
    title: "Reading: Skimming & Scanning",
    skill: "reading",
    cefr: "B1",
    minutes: 75,
    objectives: ["Skimming untuk ide utama", "Scanning untuk nama, angka, tanggal", "Mengatur waktu ±20 menit per passage"],
    explain:
      "IELTS Academic Reading: 3 passage, 40 soal, 60 menit — **tidak ada waktu tambahan** untuk menyalin jawaban.\n\n**Skimming**: baca cepat judul, kalimat pertama tiap paragraf, dan kalimat terakhir untuk menangkap ide utama (2–3 menit).\n\n**Scanning**: cari informasi spesifik (angka, nama, tanggal, kata kunci) tanpa membaca semua kata. Kata kunci yang paling mudah di-scan adalah nama dan angka karena jarang diparafrasekan.",
    examples: [["Q: In which year was the first museum opened? → scan for numbers (1800s)", "Scanning angka"], ["Q: What is the main idea of paragraph C? → read first & last sentence", "Skimming"]],
    tip: "Garis bawahi kata kunci soal sebelum membaca passage. Fitur highlight di latihan Reading bisa dipakai untuk ini.",
    exercises: [
      ["What should you read when skimming a paragraph?", ["Every word carefully", "The first and last sentences", "Only the numbers"], 1, "Ide utama biasanya di kalimat pertama/terakhir."],
      ["Which keywords are easiest to scan for?", ["Names and numbers", "Adjectives", "Linking words"], 0, "Jarang diparafrasekan."],
      ["How long should you spend on each Academic Reading passage?", ["About 10 minutes", "About 20 minutes", "About 40 minutes"], 1, "60 menit / 3 passage."],
    ],
    task: { kind: "reading", ref: "skim-scan", body: "Kerjakan passage latihan dan coba selesaikan dalam 20 menit." },
  },
  {
    tag: "tfng",
    title: "Reading: True / False / Not Given",
    skill: "reading",
    cefr: "B1",
    minutes: 90,
    objectives: ["Membedakan FALSE dan NOT GIVEN", "Mencari bukti di teks", "Waspada kata pembatas (all, some, only)"],
    explain:
      "**TRUE**: pernyataan sesuai dengan teks. **FALSE**: teks mengatakan **kebalikannya**. **NOT GIVEN**: teks **tidak memberikan informasi** untuk membenarkan atau menyalahkan.\n\nKesalahan paling umum: memilih FALSE karena *menurut pengetahuan Anda* pernyataan itu salah. Jawaban harus berdasarkan teks saja.\n\nPerhatikan kata pembatas: *all, always, only, never, most, some*. Satu kata ini bisa mengubah TRUE menjadi FALSE. Soal T/F/NG biasanya mengikuti urutan teks.\n\n(Yes/No/Not Given sama logikanya, tetapi tentang **opini penulis**.)",
    examples: [
      ["Text: 'Most visitors arrive by train.' Statement: 'All visitors arrive by train.' → FALSE", "most ≠ all"],
      ["Text: 'The bridge opened in 1990.' Statement: 'The bridge was expensive.' → NOT GIVEN", "Biaya tidak disebut"],
    ],
    exercises: [
      ["Text: 'The festival is held every summer.' Statement: 'The festival takes place once a year.'", ["TRUE", "FALSE", "NOT GIVEN"], 0, "Every summer = sekali setahun."],
      ["Text: 'Some scientists support the theory.' Statement: 'All scientists support the theory.'", ["TRUE", "FALSE", "NOT GIVEN"], 1, "some ≠ all."],
      ["Text: 'The library has 20,000 books.' Statement: 'The library is the largest in the city.'", ["TRUE", "FALSE", "NOT GIVEN"], 2, "Tidak ada perbandingan."],
      ["When the text says nothing about a statement, the answer is:", ["FALSE", "NOT GIVEN", "TRUE"], 1, "Tidak ada informasi → NOT GIVEN."],
    ],
    task: { kind: "reading", ref: "tfng", body: "Kerjakan passage dengan soal True/False/Not Given dan periksa bukti tiap jawaban." },
  },
  {
    tag: "matching-headings",
    title: "Reading: Matching Headings",
    skill: "reading",
    cefr: "B2",
    minutes: 90,
    objectives: ["Menemukan ide utama paragraf", "Menghindari jebakan kata yang sama", "Mengeliminasi heading"],
    explain:
      "Heading merangkum **ide utama seluruh paragraf**, bukan detail. Jebakan umum: heading yang memakai kata yang sama dengan satu kalimat di paragraf, padahal hanya detail.\n\nStrategi: baca paragraf, rangkum dalam 3–5 kata versi Anda, lalu cocokkan dengan heading. Kerjakan paragraf yang paling jelas dulu, lalu eliminasi.",
    examples: [["Paragraph about costs, benefits and risks of solar farms → heading: 'Weighing up a new energy source'", "Ide utama, bukan detail"]],
    exercises: [
      ["A heading should match…", ["one detail in the paragraph", "the main idea of the whole paragraph", "the first word"], 1, "Ide utama."],
      ["A heading contains exactly the same words as one sentence in the paragraph. This means…", ["it is definitely correct", "it might be a trap", "it is the title"], 1, "Sering jebakan."],
      ["Best first step:", ["Read all headings word by word many times", "Summarise each paragraph in a few words", "Guess quickly"], 1, "Rangkum dulu."],
    ],
    task: { kind: "reading", ref: "matching", body: "Latih matching headings pada passage latihan." },
  },
  {
    tag: "reading-completion",
    title: "Reading: Sentence & Summary Completion",
    skill: "reading",
    cefr: "B1",
    minutes: 75,
    objectives: ["Patuh pada batas kata (NO MORE THAN TWO WORDS)", "Memprediksi jenis kata", "Mengeja jawaban dengan tepat"],
    explain:
      "Baca instruksi batas kata: *NO MORE THAN TWO WORDS AND/OR A NUMBER*. Jawaban tiga kata = salah, walaupun isinya benar.\n\nSebelum mencari, prediksi **jenis kata** yang hilang (noun? verb? angka?) dari tata bahasa kalimat. Jawaban diambil dari teks apa adanya dan ejaan harus tepat.",
    examples: [["'The scientists used ___ to measure the temperature.' → noun (alat)", "Prediksi jenis kata"]],
    exercises: [
      ["Instruction: NO MORE THAN TWO WORDS. Answer 'the old wooden bridge' is:", ["correct", "wrong — too many words", "correct if spelled well"], 1, "Empat kata melebihi batas."],
      ["'Visitors must buy a ___ before entering.' The missing word is probably a:", ["verb", "noun", "adverb"], 1, "Setelah 'a' → noun."],
      ["Is spelling important in completion answers?", ["Yes, misspelled answers are marked wrong", "No", "Only for names"], 0, "Ejaan salah = salah."],
    ],
    task: { kind: "reading", ref: "completion", body: "Kerjakan passage dengan soal completion." },
  },
  {
    tag: "reading-mcq",
    title: "Reading: Multiple Choice & Timed Practice",
    skill: "reading",
    cefr: "B2",
    minutes: 90,
    objectives: ["Mengeliminasi distractor", "Membedakan parafrase dan kata sama", "Menyelesaikan satu passage dalam 20 menit"],
    explain:
      "Pilihan ganda IELTS sering memakai **distractor**: pilihan yang memakai kata dari teks tetapi maknanya berbeda. Pilihan yang benar biasanya **parafrase**.\n\nStrategi: baca pertanyaan (bukan pilihan) dulu, temukan bagian teks, pahami, baru bandingkan pilihan dan eliminasi yang jelas salah.",
    examples: [["Option uses exact phrase from text but adds 'always' → likely distractor", "Waspada absolut"]],
    exercises: [
      ["An option repeats the exact words from the text. It is…", ["always correct", "possibly a distractor", "never correct"], 1, "Bisa jebakan."],
      ["Best order:", ["Read options → read text", "Read question stem → locate text → compare options", "Guess"], 1, "Stem dulu."],
    ],
    task: { kind: "reading", ref: "mcq", body: "Latihan timed reading: aktifkan timer di passage latihan." },
  },

  // ───────── Listening (audio supplied later by admin) ─────────
  {
    tag: "listening-intro",
    title: "Listening: Format & Section 1 (Numbers, Spelling)",
    skill: "listening",
    cefr: "A2",
    minutes: 60,
    objectives: ["Memahami format IELTS Listening (4 bagian, 40 soal)", "Menangkap angka, tanggal, ejaan nama", "Membaca soal sebelum audio"],
    explain:
      "IELTS Listening punya 4 bagian, 40 soal, sekitar 30 menit, dan **audio hanya diputar sekali**. Bagian 1 adalah percakapan sehari-hari (misalnya memesan tiket) dan sering menguji angka, tanggal, alamat, dan ejaan nama.\n\nLatih huruf yang sering tertukar: A/E/I, G/J, B/V/P, M/N. Angka: 13 (thirteen) vs 30 (thirty) — perhatikan tekanan suku kata.\n\nGunakan waktu sebelum audio untuk membaca soal dan memprediksi jenis jawaban.",
    examples: [["'That's double-L' → LL", "Ejaan ganda"], ["'fifteen' (tekanan di belakang) vs 'fifty' (tekanan di depan)", "Angka mirip"]],
    exercises: [
      ["How many times is the audio played in the IELTS Listening test?", ["Once", "Twice", "As many as you want"], 0, "Hanya sekali."],
      ["'Double-T' means…", ["TT", "T2", "DT"], 0, "Huruf diulang."],
      ["The speaker stresses the second syllable: 'nine-TEEN'. The number is…", ["90", "19", "9"], 1, "-teen ditekan."],
    ],
    task: { kind: "listening", ref: "1", body: "Latihan audio Section 1. Jika audio belum diunggah admin, bagian ini ditandai 'Content Unavailable' dan tidak dinilai." },
  },
  {
    tag: "listening-maps",
    title: "Listening: Maps, Plans & Section 2",
    skill: "listening",
    cefr: "B1",
    minutes: 60,
    objectives: ["Kosakata arah dan posisi", "Mengikuti deskripsi denah", "Monolog Section 2"],
    explain:
      "Section 2 adalah monolog tentang situasi sehari-hari (tur, fasilitas). Soal denah membutuhkan kosakata posisi: *opposite, next to, behind, in the corner, at the end of, to the left of, between*.\n\nOrientasikan diri: temukan titik awal (\"You are here\") dan arah utara sebelum audio dimulai.",
    examples: [["'The café is opposite the main entrance.'", "opposite = berseberangan"], ["'Walk past the library and turn left.'", "past = melewati"]],
    exercises: [
      ["'Opposite' means…", ["across from", "next to", "behind"], 0, "Berseberangan."],
      ["Before a map question starts, you should…", ["find the starting point", "close your eyes", "write answers randomly"], 0, "Orientasi."],
    ],
    task: { kind: "listening", ref: "2", body: "Latihan audio Section 2 (bila tersedia)." },
  },
  {
    tag: "listening-academic",
    title: "Listening: Sections 3 & 4 (Academic)",
    skill: "listening",
    cefr: "B2",
    minutes: 75,
    objectives: ["Mengikuti diskusi akademik banyak pembicara", "Note completion di kuliah (Section 4)", "Mengenali signposting"],
    explain:
      "Section 3: diskusi akademik (2–4 orang). Section 4: kuliah monolog tanpa jeda di tengah. Kunci sukses adalah **signposting language** yang menandai perpindahan ide: *Firstly…, Moving on to…, The main reason is…, To sum up…*.\n\nDi pilihan ganda Section 3, pembicara sering menyebut beberapa pilihan lalu **mengoreksi** diri — tunggu kesimpulan akhir.",
    examples: [["'At first we thought… but actually…' → jawaban setelah 'actually'", "Koreksi"]],
    exercises: [
      ["'Moving on to the next point…' is an example of…", ["signposting", "hedging", "spelling"], 0, "Penanda perpindahan."],
      ["A speaker says 'We considered Tuesday, but in the end we chose Friday.' The answer is…", ["Tuesday", "Friday", "both"], 1, "Kesimpulan akhir."],
    ],
    task: { kind: "listening", ref: "4", body: "Latihan audio Section 3/4 (bila tersedia)." },
  },

  // ───────── Writing ─────────
  {
    tag: "writing-sentences",
    title: "Writing: Clear Sentences & Paragraphs",
    skill: "writing",
    cefr: "A2",
    minutes: 75,
    objectives: ["Menulis kalimat lengkap dan jelas", "Struktur paragraf: topic sentence, support, example", "Tanda baca dasar"],
    explain:
      "Paragraf yang baik terdiri dari **topic sentence** (ide utama), **supporting sentences** (penjelasan), dan **example** (contoh spesifik).\n\nGunakan kapital di awal kalimat dan titik di akhir. Hindari *run-on sentence* — dua kalimat lengkap yang digabung hanya dengan koma.",
    structure: [["Topic sentence", "Public transport has several advantages."], ["Support", "It reduces traffic and pollution."], ["Example", "In Singapore, the MRT carries millions of people daily."]],
    examples: [["Many students work part-time. This helps them pay for their studies.", "Dua kalimat, bukan koma"]],
    mistakes: [["I like reading, it is relaxing.", "I like reading because it is relaxing.", "Run-on sentence (comma splice)."]],
    exercises: [
      ["Which is a good topic sentence?", ["For example, in Japan…", "Technology has changed the way students learn.", "And also it is good."], 1, "Ide utama yang umum."],
      ["Choose the correctly punctuated sentence.", ["I was tired, I went to bed.", "I was tired, so I went to bed.", "i was tired so i went to bed"], 1, "Konjungsi 'so' menghindari comma splice."],
    ],
    task: { kind: "writing", ref: "paragraph", body: "Tulis paragraf pendek dan kirim untuk feedback." },
  },
  {
    tag: "task1-overview",
    title: "Writing Task 1: Line Graphs & Overview",
    skill: "writing",
    cefr: "B1",
    minutes: 120,
    objectives: ["Struktur Task 1: intro, overview, 2 body", "Menulis overview tren utama", "Bahasa tren (rise, fall, fluctuate)"],
    explain:
      "Task 1 Academic: deskripsikan grafik/tabel/diagram dalam **minimal 150 kata**, ±20 menit. Jangan memberi opini atau alasan.\n\nStruktur: (1) **Introduction** — parafrase soal. (2) **Overview** — 1–2 kalimat tren paling penting **tanpa angka detail**. Tanpa overview, Task Achievement sulit melewati band 5. (3) **Body 1 & 2** — kelompokkan data dan sertakan angka.\n\nBahasa tren: *rose steadily, fell sharply, fluctuated, remained stable, peaked at, reached a low of*.",
    structure: [["Intro", "The line graph illustrates…"], ["Overview", "Overall, X increased while Y declined…"], ["Body", "In 2000, X stood at 20%, before rising to…"]],
    examples: [["Overall, car ownership rose significantly, whereas bus use declined.", "Overview tanpa angka"], ["The figure peaked at 45% in 2010.", "peak at"]],
    mistakes: [["The graph shows that people prefer cars because they are comfortable.", "Remove the reason — describe data only.", "Task 1 tidak memberi alasan/opini."]],
    exercises: [
      ["What must the overview contain?", ["Detailed numbers", "The main trends", "Your opinion"], 1, "Tren utama."],
      ["Minimum words for Task 1?", ["100", "150", "250"], 1, "150 kata."],
      ["'The number ___ to 50 in 2010 and then remained stable.'", ["rose", "rised", "raised"], 0, "rise → rose."],
    ],
    task: { kind: "writing", ref: "task1", body: "Tulis Task 1 (line graph) dan kirim untuk evaluasi rubrik." },
  },
  {
    tag: "task1-comparisons",
    title: "Writing Task 1: Bar Charts, Tables, Process & Maps",
    skill: "writing",
    cefr: "B2",
    minutes: 120,
    objectives: ["Membandingkan data kategori", "Menulis process diagram dengan passive", "Mendeskripsikan perubahan peta"],
    explain:
      "**Bar chart/table**: fokus pada perbandingan — tertinggi, terendah, perbedaan besar. Kelompokkan kategori yang mirip.\n\n**Process**: gunakan passive dan sequencers (*First, Next, After that, Finally*). Overview menyebut jumlah tahap dan awal–akhir proses.\n\n**Maps**: bandingkan sebelum–sesudah: *was demolished, was replaced by, was extended, a new road was built*.",
    examples: [["The old factory was demolished and replaced by housing.", "Maps"], ["After being washed, the bottles are crushed.", "Process"]],
    exercises: [
      ["Process diagrams usually use…", ["the passive voice", "only the future tense", "opinions"], 0, "Pelaku tidak penting."],
      ["For a map, 'the trees were cut down to make way for a car park' describes…", ["a change", "a trend", "an opinion"], 0, "Perubahan."],
    ],
    task: { kind: "writing", ref: "task1", body: "Tulis Task 1 dan bandingkan dengan feedback." },
  },
  {
    tag: "task2-opinion",
    title: "Writing Task 2: Opinion Essay",
    skill: "writing",
    cefr: "B1",
    minutes: 120,
    objectives: ["Menjawab semua bagian soal", "Struktur 4 paragraf", "Posisi jelas sepanjang esai"],
    explain:
      "Task 2: esai **minimal 250 kata**, ±40 menit, bobotnya dua kali Task 1.\n\nOpinion essay (*To what extent do you agree or disagree?*): nyatakan posisi jelas di introduction dan pertahankan sampai conclusion.\n\nStruktur: **Intro** (parafrase + thesis) → **Body 1** (alasan 1 + penjelasan + contoh) → **Body 2** (alasan 2) → **Conclusion** (ulang posisi).\n\nTask Response band 7 membutuhkan ide yang **dikembangkan** — bukan hanya disebut.",
    structure: [["Thesis", "I strongly agree that… because… and…"], ["Body", "Topic sentence → explain → example → link"], ["Conclusion", "In conclusion, I firmly believe…"]],
    examples: [["I completely agree that governments should fund public libraries, as they promote literacy and provide free access to information.", "Thesis dengan 2 alasan"]],
    mistakes: [["Writing a balanced 'some people… other people…' essay with no clear opinion.", "State and keep one clear position.", "Posisi tidak jelas menurunkan Task Response."]],
    exercises: [
      ["Minimum words for Task 2?", ["150", "250", "300"], 1, "250 kata."],
      ["Where should your opinion appear first?", ["Only in the conclusion", "In the introduction", "Nowhere"], 1, "Thesis di intro."],
      ["A body paragraph should…", ["list many ideas briefly", "develop one main idea with explanation and example", "repeat the question"], 1, "Kembangkan satu ide."],
    ],
    task: { kind: "writing", ref: "task2", body: "Tulis opinion essay dan minta evaluasi." },
  },
  {
    tag: "task2-discussion",
    title: "Writing Task 2: Discussion & Advantages/Disadvantages",
    skill: "writing",
    cefr: "B2",
    minutes: 120,
    objectives: ["Membahas dua sisi secara seimbang", "Memberi opini pribadi bila diminta", "Struktur esai advantages/disadvantages"],
    explain:
      "*Discuss both views and give your opinion*: wajib membahas **kedua** pandangan **dan** memberi opini Anda. Melupakan opini = tidak menjawab semua bagian soal.\n\n*Do the advantages outweigh the disadvantages?*: ini pertanyaan opini — tentukan mana yang lebih berat dan katakan dengan jelas.",
    examples: [["While some argue that…, others believe that… In my view, …", "Dua sisi + opini"]],
    exercises: [
      ["'Discuss both views and give your own opinion.' You must…", ["discuss one view", "discuss both views and give your opinion", "only give your opinion"], 1, "Semua bagian."],
      ["'Do the advantages outweigh the disadvantages?' requires…", ["a clear judgement", "no opinion", "only advantages"], 0, "Penilaian jelas."],
    ],
    task: { kind: "writing", ref: "task2", body: "Tulis discussion essay." },
  },
  {
    tag: "task2-problem-solution",
    title: "Writing Task 2: Problem–Solution & Two-part Questions",
    skill: "writing",
    cefr: "B2",
    minutes: 120,
    objectives: ["Menghubungkan solusi dengan masalah", "Menjawab dua pertanyaan berbeda", "Contoh yang spesifik dan relevan"],
    explain:
      "Problem–solution: jelaskan penyebab/masalah lalu solusi yang **langsung menjawab** masalah tersebut. Two-part question: jawab kedua pertanyaan dengan proporsi seimbang.\n\nContoh spesifik (negara, kebijakan, situasi nyata yang umum) lebih meyakinkan daripada klaim umum.",
    examples: [["One solution is to introduce congestion charges, as London did, which directly discourages unnecessary car journeys.", "Solusi + contoh + hubungan ke masalah"]],
    exercises: [
      ["A good solution paragraph…", ["links each solution to a specific problem", "lists solutions unrelated to the problem", "repeats the problem"], 0, "Relevan."],
      ["A two-part question has two questions. You should…", ["answer only the easier one", "answer both", "write a general essay"], 1, "Jawab keduanya."],
    ],
    task: { kind: "writing", ref: "task2", body: "Tulis essay problem–solution." },
  },
  {
    tag: "coherence",
    title: "Writing: Coherence & Cohesion for Band 7",
    skill: "writing",
    cefr: "B2",
    minutes: 90,
    objectives: ["Progresi ide yang logis", "Referencing (this, these, such)", "Paragraf dengan satu ide sentral"],
    explain:
      "Band 7 C&C: ide berurutan logis, cohesive devices dipakai **tepat** (meski kadang berlebihan/kurang), dan setiap paragraf punya ide sentral jelas.\n\nSelain linking words, gunakan **referencing** untuk menghindari pengulangan: *This trend…, Such policies…, These measures…*.",
    examples: [["Many cities have introduced bike lanes. This measure has reduced traffic.", "Referencing 'This measure'"]],
    exercises: [
      ["'Governments built new parks. ___ policy improved residents' health.'", ["This", "These", "That's"], 0, "Merujuk satu kebijakan."],
      ["Each body paragraph should have…", ["one clear central topic", "three unrelated ideas", "no topic"], 0, "Satu ide sentral."],
    ],
    task: { kind: "writing", ref: "task2", body: "Revisi esai sebelumnya dengan fokus coherence." },
  },
  {
    tag: "lexical-resource",
    title: "Writing: Lexical Precision & Collocations",
    skill: "writing",
    cefr: "B2",
    minutes: 90,
    objectives: ["Memilih kata yang tepat, bukan yang panjang", "Collocation akademis", "Menghindari pengulangan"],
    explain:
      "Lexical Resource band 7: memakai kosakata yang kurang umum **dengan kesadaran style dan collocation**, dengan sesekali kesalahan.\n\nContoh peningkatan: *big problem → serious problem / pressing issue*, *do a crime → commit a crime*, *make research → conduct research*.",
    examples: [["conduct research", "bukan 'make research'"], ["a pressing issue", "masalah mendesak"], ["play a crucial role", "berperan penting"]],
    exercises: [
      ["Correct collocation:", ["make a crime", "commit a crime", "do a crime"], 1, "commit a crime."],
      ["Correct collocation:", ["conduct research", "make research", "do researches"], 0, "conduct research."],
      ["More precise alternative to 'very big problem':", ["a pressing issue", "a very very big problem", "a large trouble"], 0, "pressing issue."],
    ],
    task: { kind: "writing", ref: "task2", body: "Tulis ulang esai dengan kosakata lebih presisi." },
  },

  // ───────── Speaking ─────────
  {
    tag: "speaking-intro",
    title: "Speaking: Introducing Yourself & Part 1 Format",
    skill: "speaking",
    cefr: "A2",
    minutes: 60,
    objectives: ["Memahami format Speaking (3 bagian, 11–14 menit)", "Menjawab Part 1 dengan 2–3 kalimat", "Memperluas jawaban dengan alasan/contoh"],
    explain:
      "IELTS Speaking: wawancara tatap muka 11–14 menit. **Part 1** (4–5 menit): pertanyaan tentang diri sendiri (rumah, kerja/studi, hobi).\n\nJangan menjawab satu kata. Formula sederhana: **Jawab + Alasan + Contoh/Detail**. Contoh: *Do you like reading?* → *Yes, I do. It helps me relax after work. At the moment I'm reading a novel about…*",
    examples: [["I'm currently studying engineering at a university in Surabaya, and I'm in my second year.", "Jawaban diperluas"]],
    exercises: [
      ["Best Part 1 answer to 'Do you like cooking?'", ["Yes.", "Yes, I do. It's relaxing, and I often cook Padang dishes for my family.", "Cooking is defined as preparing food."], 1, "Jawab + alasan + detail."],
      ["How long is the Speaking test?", ["11–14 minutes", "30 minutes", "5 minutes"], 0, "11–14 menit."],
    ],
    task: { kind: "speaking", ref: "1", body: "Rekam jawaban Part 1 dan dapatkan feedback." },
  },
  {
    tag: "speaking-part2",
    title: "Speaking Part 2: Cue Card (Long Turn)",
    skill: "speaking",
    cefr: "B1",
    minutes: 75,
    objectives: ["Menggunakan 1 menit persiapan secara efektif", "Berbicara 1–2 menit tanpa berhenti", "Struktur cerita: situasi, detail, perasaan"],
    explain:
      "Part 2: Anda mendapat kartu topik, **1 menit persiapan**, lalu berbicara **sampai 2 menit**. Tulis catatan kata kunci (bukan kalimat) untuk setiap poin di kartu.\n\nStruktur: perkenalkan topik → jawab tiap poin dengan detail → akhiri dengan perasaan/alasan. Gunakan Past Simple untuk cerita masa lalu.",
    examples: [["I'd like to talk about a teacher who had a big influence on me…", "Pembukaan natural"]],
    exercises: [
      ["Preparation time in Part 2:", ["1 minute", "5 minutes", "none"], 0, "1 menit."],
      ["Your notes should be…", ["full sentences", "keywords", "nothing"], 1, "Kata kunci."],
    ],
    task: { kind: "speaking", ref: "2", body: "Rekam jawaban cue card Part 2 (2 menit)." },
  },
  {
    tag: "speaking-part3",
    title: "Speaking Part 3: Discussion",
    skill: "speaking",
    cefr: "B2",
    minutes: 75,
    objectives: ["Menjawab pertanyaan abstrak", "Memberi opini dengan alasan dan perbandingan", "Bahasa spekulasi"],
    explain:
      "Part 3 (4–5 menit): diskusi abstrak terkait topik Part 2 (masyarakat, masa depan, perbandingan). Jawaban ideal lebih panjang: **opini → alasan → contoh → konsekuensi/kontras**.\n\nBahasa berguna: *It depends on…, One possible reason is…, In the long run…, Compared to the past…, I'd imagine that…*",
    examples: [["I'd say it depends on the age group. Older people tend to…, whereas teenagers…", "Membandingkan"]],
    exercises: [
      ["Part 3 questions are usually…", ["personal and simple", "abstract and about society", "about spelling"], 1, "Abstrak."],
      ["Good phrase for speculating about the future:", ["I'd imagine that…", "Yesterday I…", "My name is…"], 0, "Spekulasi."],
    ],
    task: { kind: "speaking", ref: "3", body: "Rekam jawaban diskusi Part 3." },
  },
  {
    tag: "fluency",
    title: "Speaking: Fluency, Fillers & Self-correction",
    skill: "speaking",
    cefr: "B2",
    minutes: 60,
    objectives: ["Berbicara lancar tanpa jeda panjang", "Filler natural vs 'emm…'", "Self-correction yang wajar"],
    explain:
      "Fluency & Coherence band 7: berbicara panjang tanpa usaha yang terlihat, dengan sesekali ragu karena mencari kata. Ganti jeda kosong dengan **filler natural**: *Well…, Let me think…, That's an interesting question…, What I mean is…*.\n\nMengoreksi diri sekali-sekali tidak apa-apa; terlalu sering akan mengganggu kelancaran.",
    examples: [["Well, that's a tricky question, but I suppose…", "Membeli waktu dengan natural"]],
    exercises: [
      ["Which is a natural filler?", ["Let me think…", "(silence for 10 seconds)", "Next question."], 0, "Natural."],
    ],
    task: { kind: "speaking", ref: "1", body: "Rekam jawaban 1 menit tanpa jeda panjang." },
  },
  {
    tag: "pronunciation",
    title: "Pronunciation: Word Stress & Common Sounds",
    skill: "speaking",
    cefr: "B1",
    minutes: 60,
    objectives: ["Word stress pada kata akademis", "Bunyi akhir (-ed, -s) yang sering hilang", "Bunyi /θ/ dan /ð/"],
    explain:
      "Penutur bahasa Indonesia sering menghilangkan **bunyi akhir** (*work* vs *worked*, *student* vs *students*) dan mengganti /θ/ (think) dengan /t/.\n\nWord stress mengubah kejelasan: *PHO-to-graph*, *pho-TO-gra-pher*, *pho-to-GRA-phic*.\n\nCatatan: penilaian pronunciation di platform ini memerlukan analisis audio. Bila hanya transkrip yang tersedia, sistem **tidak** memberi skor pronunciation.",
    examples: [["She worked /wɜːkt/ late.", "-ed dibaca /t/"], ["I think /θɪŋk/ so.", "/θ/ bukan /t/"]],
    exercises: [
      ["Stress in 'photographer':", ["PHO-to-gra-pher", "pho-TO-gra-pher", "pho-to-GRA-pher"], 1, "pho-TO-gra-pher."],
      ["'-ed' in 'watched' sounds like…", ["/t/", "/d/", "/ɪd/"], 0, "Setelah bunyi tak bersuara → /t/."],
    ],
    task: { kind: "speaking", ref: "1", body: "Rekam dan dengarkan kembali rekaman Anda untuk bunyi akhir." },
  },

  // ───────── Exam practice ─────────
  {
    tag: "exam-strategy",
    title: "Exam Strategy & Time Management",
    skill: "exam",
    cefr: "B2",
    minutes: 60,
    objectives: ["Alokasi waktu tiap modul", "Strategi saat tidak tahu jawaban", "Persiapan hari ujian"],
    explain:
      "Listening ±30 menit (+ waktu transfer jawaban pada ujian kertas), Reading 60 menit (tanpa waktu tambahan), Writing 60 menit (Task 1 ±20, Task 2 ±40), Speaking 11–14 menit.\n\nTidak ada pengurangan nilai untuk jawaban salah — **jangan biarkan soal kosong** di Listening dan Reading.",
    examples: [["Writing: start with Task 2? Many candidates do, because it carries more weight.", "Pilihan strategi"]],
    exercises: [
      ["Is there a penalty for wrong answers in Reading?", ["Yes", "No", "Only in Section 3"], 1, "Tidak ada penalti."],
      ["Recommended time for Writing Task 2:", ["20 minutes", "40 minutes", "60 minutes"], 1, "40 menit."],
    ],
    task: { kind: "mock", body: "Kerjakan Mini Test untuk mengukur kesiapan." },
  },
];
