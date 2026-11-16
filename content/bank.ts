// Original question bank, passages and prompts for IELTS Academy.

type Q = { type: "mcq" | "tfng" | "ynng" | "completion" | "matching" | "short"; prompt: string; options?: string[]; answer: number | string | string[]; explanation: string; evidence?: string; skillTag: string; cefr?: string; difficulty?: number };

// ───────── Diagnostic: Grammar & Vocabulary (A1 → C1, increasing difficulty) ─────────
export const DIAGNOSTIC_GV: (Q & { section: "grammar" | "vocabulary"; cefr: string })[] = [
  { section: "grammar", cefr: "A1", type: "mcq", prompt: "My sister ___ a teacher.", options: ["am", "is", "are"], answer: 1, explanation: "She → is.", skillTag: "sentence-structure" },
  { section: "grammar", cefr: "A1", type: "mcq", prompt: "They ___ football every Sunday.", options: ["plays", "play", "playing"], answer: 1, explanation: "They + verb dasar.", skillTag: "present-simple" },
  { section: "vocabulary", cefr: "A1", type: "mcq", prompt: "The opposite of 'cheap' is ___.", options: ["expensive", "small", "fast"], answer: 0, explanation: "cheap ↔ expensive.", skillTag: "vocab-basic" },
  { section: "grammar", cefr: "A1", type: "mcq", prompt: "There ___ two books on the table.", options: ["is", "are", "be"], answer: 1, explanation: "Plural → are.", skillTag: "sentence-structure" },
  { section: "grammar", cefr: "A2", type: "mcq", prompt: "He ___ to work by bus yesterday.", options: ["go", "goes", "went"], answer: 2, explanation: "yesterday → past simple.", skillTag: "past-simple" },
  { section: "grammar", cefr: "A2", type: "mcq", prompt: "She is ___ engineer.", options: ["a", "an", "the"], answer: 1, explanation: "an + bunyi vokal.", skillTag: "articles" },
  { section: "vocabulary", cefr: "A2", type: "mcq", prompt: "I need some ___ about the course.", options: ["informations", "information", "an information"], answer: 1, explanation: "information uncountable.", skillTag: "countability" },
  { section: "grammar", cefr: "A2", type: "mcq", prompt: "This exam is ___ than the last one.", options: ["more easy", "easier", "easiest"], answer: 1, explanation: "easy → easier.", skillTag: "comparatives" },
  { section: "grammar", cefr: "B1", type: "mcq", prompt: "I ___ in Jakarta since 2015.", options: ["live", "lived", "have lived"], answer: 2, explanation: "since → present perfect.", skillTag: "present-perfect" },
  { section: "grammar", cefr: "B1", type: "mcq", prompt: "If it ___ tomorrow, we will cancel the trip.", options: ["rains", "will rain", "rained"], answer: 0, explanation: "First conditional: if + present.", skillTag: "conditionals" },
  { section: "vocabulary", cefr: "B1", type: "mcq", prompt: "Factories should reduce carbon ___.", options: ["emissions", "admissions", "permissions"], answer: 0, explanation: "carbon emissions.", skillTag: "vocab-environment" },
  { section: "grammar", cefr: "B1", type: "mcq", prompt: "The bridge ___ in 1998.", options: ["built", "was built", "has built"], answer: 1, explanation: "Passive past.", skillTag: "passive-voice" },
  { section: "vocabulary", cefr: "B1", type: "mcq", prompt: "Many students work part-time to pay their tuition ___.", options: ["costs", "fees", "prices"], answer: 1, explanation: "tuition fees.", skillTag: "vocab-education" },
  { section: "grammar", cefr: "B2", type: "mcq", prompt: "___ the high cost, many families still choose private schools.", options: ["Although", "Despite", "However"], answer: 1, explanation: "Despite + noun.", skillTag: "linking-words" },
  { section: "grammar", cefr: "B2", type: "mcq", prompt: "If I ___ more time, I would learn another language.", options: ["have", "had", "will have"], answer: 1, explanation: "Second conditional.", skillTag: "conditionals" },
  { section: "vocabulary", cefr: "B2", type: "mcq", prompt: "The number of visitors ___ between 2010 and 2015, rising and falling each year.", options: ["fluctuated", "stagnated", "peaked"], answer: 0, explanation: "fluctuate = naik-turun.", skillTag: "vocab-academic" },
  { section: "grammar", cefr: "B2", type: "mcq", prompt: "The city, ___ is famous for its temples, attracts millions of tourists.", options: ["that", "which", "where"], answer: 1, explanation: "Non-defining → which.", skillTag: "relative-clauses" },
  { section: "vocabulary", cefr: "B2", type: "mcq", prompt: "Scientists ___ research to test the new vaccine.", options: ["made", "did", "conducted"], answer: 2, explanation: "conduct research.", skillTag: "lexical-resource" },
  { section: "grammar", cefr: "C1", type: "mcq", prompt: "___ the report, the manager called a meeting.", options: ["Having read", "Had read", "Being read"], answer: 0, explanation: "Participle clause perfect.", skillTag: "grammar-range" },
  { section: "vocabulary", cefr: "C1", type: "mcq", prompt: "Some job losses due to automation seem ___.", options: ["inevitable", "inedible", "invaluable"], answer: 0, explanation: "inevitable = tak terelakkan.", skillTag: "vocab-academic" },
  { section: "grammar", cefr: "C1", type: "mcq", prompt: "Not only ___ the deadline, but they also exceeded expectations.", options: ["they met", "did they meet", "they did meet"], answer: 1, explanation: "Inversion setelah 'Not only'.", skillTag: "grammar-range" },
  { section: "vocabulary", cefr: "C1", type: "mcq", prompt: "Governments must take measures to ___ the impact of climate change.", options: ["mitigate", "migrate", "mediate"], answer: 0, explanation: "mitigate the impact.", skillTag: "vocab-environment" },
];

// ───────── Reading passages (original texts) ─────────
export type PassageDef = { key: string; title: string; topic: string; cefr: string; difficulty: number; timeLimitMin: number; usage: "diagnostic" | "practice" | "mock"; body: string; questions: Q[] };

export const PASSAGES: PassageDef[] = [
  {
    key: "diag-urban-gardens",
    title: "Urban Rooftop Gardens",
    topic: "environment",
    cefr: "B1",
    difficulty: 2,
    timeLimitMin: 15,
    usage: "diagnostic",
    body: `In many large cities, empty rooftops are being turned into small farms. These rooftop gardens grow vegetables, herbs and sometimes fruit trees, and they are usually managed by local residents or community groups.

Supporters say the gardens bring several benefits. Plants absorb heat, so buildings with gardens on top stay cooler in summer and need less air conditioning. The gardens also give city children a chance to see how food is grown, which many have never experienced.

However, rooftop farming is not suitable for every building. Soil and water are heavy, and older roofs may not be strong enough to carry the extra weight. Before a garden is built, an engineer must usually check the structure. Installation can therefore be expensive, and some projects have been cancelled because of the cost.

Despite these challenges, the number of rooftop gardens has grown steadily over the past ten years. Several city councils now offer small grants to residents who want to start one.`,
    questions: [
      { type: "tfng", prompt: "Rooftop gardens are always managed by city councils.", answer: "FALSE", explanation: "Teks: biasanya dikelola warga atau kelompok komunitas.", evidence: "usually managed by local residents or community groups", skillTag: "tfng" },
      { type: "tfng", prompt: "Buildings with rooftop gardens may use less air conditioning.", answer: "TRUE", explanation: "Bangunan lebih sejuk sehingga butuh lebih sedikit AC.", evidence: "need less air conditioning", skillTag: "tfng" },
      { type: "tfng", prompt: "Most city children prefer vegetables grown on rooftops.", answer: "NOT GIVEN", explanation: "Preferensi anak tidak disebutkan.", evidence: "", skillTag: "tfng" },
      { type: "mcq", prompt: "Why must an engineer check the building first?", options: ["To design the garden", "Because older roofs may not support the weight", "To calculate the grant"], answer: 1, explanation: "Tanah dan air berat; atap lama mungkin tidak kuat.", evidence: "older roofs may not be strong enough to carry the extra weight", skillTag: "reading-mcq" },
      { type: "completion", prompt: "Some projects were cancelled because of the ______. (ONE WORD)", answer: ["cost"], explanation: "…cancelled because of the cost.", evidence: "some projects have been cancelled because of the cost", skillTag: "reading-completion" },
      { type: "completion", prompt: "Several councils offer small ______ to residents. (ONE WORD)", answer: ["grants"], explanation: "…offer small grants…", evidence: "offer small grants to residents", skillTag: "reading-completion" },
    ],
  },
  {
    key: "sleep-and-memory",
    title: "Sleep and Memory",
    topic: "health",
    cefr: "B2",
    difficulty: 3,
    timeLimitMin: 20,
    usage: "practice",
    body: `A For centuries, sleep was regarded simply as a period of rest. Over the last fifty years, however, researchers have shown that the sleeping brain is remarkably active, and that this activity plays an important role in learning.

B In a typical experiment, volunteers learn a list of word pairs in the evening. Half of them then sleep normally, while the other half are kept awake. When tested the next morning, those who slept usually remember significantly more pairs. Similar results have been found for motor skills, such as playing a short melody on a keyboard.

C Scientists believe that during deep sleep, the brain replays recent experiences and transfers them from short-term storage to longer-term memory. Brain scans show that areas active during learning become active again during sleep, sometimes in the same order.

D Not all researchers agree on how important dreaming is in this process. Some argue that dreams are merely a side effect of memory processing, while others suggest that they help the brain connect new information with older knowledge. So far, the evidence for either view remains limited.

E The findings have practical implications for students. Studying late into the night and sacrificing sleep may feel productive, but it can reduce how much is retained. Short naps of around twenty minutes after learning have also been linked to small improvements in recall, although the effect varies between individuals.`,
    questions: [
      { type: "matching", prompt: "Which paragraph describes a typical experiment?", options: ["A", "B", "C", "D", "E"], answer: 1, explanation: "Paragraf B: 'In a typical experiment…'", evidence: "In a typical experiment, volunteers learn a list of word pairs", skillTag: "matching-headings" },
      { type: "matching", prompt: "Which paragraph mentions disagreement between researchers?", options: ["A", "B", "C", "D", "E"], answer: 3, explanation: "Paragraf D: 'Not all researchers agree…'", evidence: "Not all researchers agree", skillTag: "matching-headings" },
      { type: "matching", prompt: "Which paragraph gives advice relevant to students?", options: ["A", "B", "C", "D", "E"], answer: 4, explanation: "Paragraf E: practical implications for students.", evidence: "practical implications for students", skillTag: "matching-headings" },
      { type: "tfng", prompt: "People who sleep after learning tend to remember more.", answer: "TRUE", explanation: "Yang tidur mengingat lebih banyak pasangan kata.", evidence: "those who slept usually remember significantly more pairs", skillTag: "tfng" },
      { type: "tfng", prompt: "Sleep improves memory for words but not for physical skills.", answer: "FALSE", explanation: "Hasil serupa ditemukan untuk motor skills.", evidence: "Similar results have been found for motor skills", skillTag: "tfng" },
      { type: "tfng", prompt: "Most scientists believe dreams are the main cause of memory improvement.", answer: "NOT GIVEN", explanation: "Teks hanya menyebut pendapat berbeda dan bukti terbatas; tidak ada 'most scientists'.", evidence: "the evidence for either view remains limited", skillTag: "tfng" },
      { type: "mcq", prompt: "According to paragraph C, during deep sleep the brain…", options: ["stops processing information", "replays recent experiences", "deletes short-term memories"], answer: 1, explanation: "'the brain replays recent experiences'", evidence: "the brain replays recent experiences", skillTag: "reading-mcq" },
      { type: "mcq", prompt: "What does the writer say about short naps?", options: ["They help everyone equally", "They are linked to small improvements that vary by person", "They are harmful"], answer: 1, explanation: "Efeknya kecil dan bervariasi.", evidence: "linked to small improvements in recall, although the effect varies between individuals", skillTag: "reading-mcq" },
      { type: "completion", prompt: "Sleep was once considered just a period of ______. (ONE WORD)", answer: ["rest"], explanation: "'regarded simply as a period of rest'", evidence: "regarded simply as a period of rest", skillTag: "reading-completion" },
      { type: "completion", prompt: "Recommended naps last around ______ minutes. (ONE WORD OR A NUMBER)", answer: ["twenty", "20"], explanation: "'around twenty minutes'", evidence: "Short naps of around twenty minutes", skillTag: "reading-completion" },
    ],
  },
  {
    key: "history-of-bicycles",
    title: "The Return of the Bicycle",
    topic: "transport",
    cefr: "B2",
    difficulty: 3,
    timeLimitMin: 20,
    usage: "practice",
    body: `A When the first pedal-driven bicycles appeared in the nineteenth century, they were expensive and difficult to ride. Within a few decades, however, improvements such as equal-sized wheels and air-filled tyres made cycling safer and more comfortable, and the bicycle became a common form of transport for ordinary workers.

B In the second half of the twentieth century, cars replaced bicycles in many countries. Cities were redesigned around wide roads and parking spaces, and cycling came to be seen as a hobby rather than a serious way to travel.

C Since the early 2000s, a number of cities have tried to reverse this trend. Some have built networks of protected cycle lanes, physically separated from car traffic. Others have introduced public bike-sharing schemes, allowing residents to rent a bicycle for short trips using a card or a phone app.

D The results have been mixed. In cities with continuous, well-connected lanes, cycling rates have risen sharply. Where lanes are short or end suddenly at busy junctions, many people still feel unsafe and continue to drive.

E Electric bicycles may change the situation further. Because the motor assists the rider, longer distances and steep hills become manageable, and older people who had given up cycling are returning to it. Critics, however, point out that faster bicycles create new safety concerns on shared paths.`,
    questions: [
      { type: "matching", prompt: "Choose the best heading for paragraph B.", options: ["Early technical problems", "The car takes over", "Mixed results", "A new kind of bicycle"], answer: 1, explanation: "Mobil menggantikan sepeda.", evidence: "cars replaced bicycles in many countries", skillTag: "matching-headings" },
      { type: "matching", prompt: "Choose the best heading for paragraph D.", options: ["Early technical problems", "The car takes over", "Why design quality matters", "A new kind of bicycle"], answer: 2, explanation: "Hasil bergantung pada kualitas jaringan jalur.", evidence: "In cities with continuous, well-connected lanes, cycling rates have risen sharply", skillTag: "matching-headings" },
      { type: "matching", prompt: "Choose the best heading for paragraph E.", options: ["Early technical problems", "The car takes over", "Why design quality matters", "Technology brings new riders — and risks"], answer: 3, explanation: "E-bike menarik pengendara baru tetapi ada risiko keselamatan.", evidence: "older people who had given up cycling are returning", skillTag: "matching-headings" },
      { type: "ynng", prompt: "The writer believes bike-sharing schemes are more effective than cycle lanes.", answer: "NOT GIVEN", explanation: "Penulis tidak membandingkan efektivitas keduanya.", evidence: "", skillTag: "tfng" },
      { type: "tfng", prompt: "Early bicycles were cheap and easy to ride.", answer: "FALSE", explanation: "Teks: expensive and difficult to ride.", evidence: "they were expensive and difficult to ride", skillTag: "tfng" },
      { type: "tfng", prompt: "Disconnected cycle lanes may not persuade people to stop driving.", answer: "TRUE", explanation: "Jalur pendek → orang tetap menyetir.", evidence: "many people still feel unsafe and continue to drive", skillTag: "tfng" },
      { type: "completion", prompt: "Protected lanes are physically separated from car ______. (ONE WORD)", answer: ["traffic"], explanation: "'separated from car traffic'", evidence: "physically separated from car traffic", skillTag: "reading-completion" },
      { type: "short", prompt: "What two improvements made early cycling more comfortable? (NO MORE THAN FOUR WORDS) — give the second one.", answer: ["air-filled tyres", "air filled tyres"], explanation: "equal-sized wheels and air-filled tyres.", evidence: "equal-sized wheels and air-filled tyres", skillTag: "reading-completion" },
      { type: "mcq", prompt: "What concern do critics raise about electric bicycles?", options: ["They are too expensive", "They create safety concerns on shared paths", "They cannot climb hills"], answer: 1, explanation: "Sepeda lebih cepat → masalah keselamatan.", evidence: "faster bicycles create new safety concerns on shared paths", skillTag: "reading-mcq" },
      { type: "mcq", prompt: "Bike-sharing schemes allow residents to…", options: ["buy bicycles cheaply", "rent a bicycle for short trips", "build their own lanes"], answer: 1, explanation: "'rent a bicycle for short trips'", evidence: "rent a bicycle for short trips", skillTag: "reading-mcq" },
    ],
  },
  {
    key: "mock-coral",
    title: "Coral Reefs Under Pressure",
    topic: "environment",
    cefr: "B2",
    difficulty: 4,
    timeLimitMin: 20,
    usage: "mock",
    body: `A Coral reefs cover less than one percent of the ocean floor, yet they support roughly a quarter of all marine species. The reefs are built by tiny animals called polyps, which live in partnership with microscopic algae. The algae provide the polyps with food produced through photosynthesis, and in return they receive shelter and nutrients.

B This partnership is sensitive to temperature. When sea water becomes even one or two degrees warmer than normal for several weeks, the polyps expel the algae. Without them, the coral loses its colour — a process known as bleaching — and if the conditions continue, the coral may die.

C Bleaching events used to be rare, but they have become far more frequent. Scientists link this mainly to rising ocean temperatures, although pollution from farms and cities also weakens reefs by encouraging the growth of seaweed that competes with coral for space and light.

D Several approaches are being tested to protect reefs. In some regions, fishing is restricted so that fish which eat seaweed can recover. Elsewhere, researchers grow young coral in underwater nurseries and transplant it onto damaged reefs. A more experimental idea involves breeding corals that can tolerate warmer water.

E None of these measures, however, can replace action on the underlying cause. Most marine biologists agree that, without significant reductions in greenhouse gas emissions, local protection will only slow the decline rather than stop it.`,
    questions: [
      { type: "tfng", prompt: "Coral reefs cover a large part of the ocean floor.", answer: "FALSE", explanation: "Kurang dari 1%.", evidence: "cover less than one percent of the ocean floor", skillTag: "tfng" },
      { type: "tfng", prompt: "The algae obtain shelter from the polyps.", answer: "TRUE", explanation: "'in return they receive shelter and nutrients'", evidence: "in return they receive shelter and nutrients", skillTag: "tfng" },
      { type: "tfng", prompt: "Bleaching always kills coral within a week.", answer: "FALSE", explanation: "Koral 'may die' jika kondisi berlanjut — tidak selalu, tidak seminggu.", evidence: "if the conditions continue, the coral may die", skillTag: "tfng" },
      { type: "tfng", prompt: "Underwater nurseries are cheaper than fishing restrictions.", answer: "NOT GIVEN", explanation: "Biaya tidak dibandingkan.", evidence: "", skillTag: "tfng" },
      { type: "completion", prompt: "Reefs are built by small animals called ______. (ONE WORD)", answer: ["polyps"], explanation: "'tiny animals called polyps'", evidence: "tiny animals called polyps", skillTag: "reading-completion" },
      { type: "completion", prompt: "The loss of colour in coral is called ______. (ONE WORD)", answer: ["bleaching"], explanation: "'a process known as bleaching'", evidence: "a process known as bleaching", skillTag: "reading-completion" },
      { type: "completion", prompt: "Pollution encourages the growth of ______, which competes with coral. (ONE WORD)", answer: ["seaweed"], explanation: "'growth of seaweed'", evidence: "encouraging the growth of seaweed", skillTag: "reading-completion" },
      { type: "mcq", prompt: "Why is fishing restricted in some regions?", options: ["To protect tourists", "So that seaweed-eating fish can recover", "To grow coral nurseries"], answer: 1, explanation: "Ikan pemakan rumput laut bisa pulih.", evidence: "fishing is restricted so that fish which eat seaweed can recover", skillTag: "reading-mcq" },
      { type: "mcq", prompt: "What is the writer's main point in paragraph E?", options: ["Local protection is enough", "Emission cuts are essential", "Coral cannot be saved"], answer: 1, explanation: "Tanpa pengurangan emisi, perlindungan lokal hanya memperlambat.", evidence: "without significant reductions in greenhouse gas emissions", skillTag: "reading-mcq" },
      { type: "matching", prompt: "Which paragraph describes experimental solutions?", options: ["A", "B", "C", "D", "E"], answer: 3, explanation: "Paragraf D.", evidence: "A more experimental idea involves breeding corals", skillTag: "matching-headings" },
      { type: "matching", prompt: "Which paragraph explains the cause of bleaching?", options: ["A", "B", "C", "D", "E"], answer: 1, explanation: "Paragraf B: suhu.", evidence: "When sea water becomes even one or two degrees warmer", skillTag: "matching-headings" },
      { type: "matching", prompt: "Which paragraph explains why bleaching has increased?", options: ["A", "B", "C", "D", "E"], answer: 2, explanation: "Paragraf C.", evidence: "Scientists link this mainly to rising ocean temperatures", skillTag: "matching-headings" },
    ],
  },
];

// ───────── Writing prompts ─────────
const LINE_SVG = `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Line graph: percentage of households with internet access in three countries, 2000 to 2020"><style>text{font:11px sans-serif;fill:currentColor}</style><line x1="40" y1="200" x2="400" y2="200" stroke="currentColor" opacity=".4"/><line x1="40" y1="20" x2="40" y2="200" stroke="currentColor" opacity=".4"/>${[0, 25, 50, 75, 100].map((v) => `<text x="8" y="${204 - v * 1.8}">${v}%</text>`).join("")}${["2000", "2005", "2010", "2015", "2020"].map((y, i) => `<text x="${30 + i * 88}" y="218">${y}</text>`).join("")}<polyline fill="none" stroke="#2f6fde" stroke-width="2.5" points="40,164 128,128 216,74 304,47 392,38"/><polyline fill="none" stroke="#d9822b" stroke-width="2.5" points="40,191 128,182 216,155 304,110 392,65"/><polyline fill="none" stroke="#2a9d6f" stroke-width="2.5" points="40,182 128,146 216,128 304,119 392,110"/><text x="300" y="30" fill="#2f6fde">Country A</text><text x="300" y="80" fill="#d9822b">Country B</text><text x="300" y="104" fill="#2a9d6f">Country C</text></svg>`;

export const WRITING_PROMPTS = [
  { key: "para-hometown", taskType: "paragraph", title: "Paragraph: Your Hometown", prompt: "Write a paragraph (80–120 words) describing your hometown. Include a topic sentence, at least two supporting details and one example.", minWords: 80, timeLimitMin: 20, usage: "diagnostic" },
  { key: "para-technology", taskType: "paragraph", title: "Paragraph: Technology in Daily Life", prompt: "Write a paragraph (100–150 words) explaining how one piece of technology has changed your daily life. Give reasons and an example.", minWords: 100, timeLimitMin: 20, usage: "practice" },
  { key: "t1-internet", taskType: "task1", title: "Task 1: Household Internet Access", prompt: "The line graph shows the percentage of households with internet access in three countries between 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.", imageData: LINE_SVG, minWords: 150, timeLimitMin: 20, usage: "practice" },
  { key: "t2-remote-work", taskType: "task2", title: "Task 2: Working From Home", prompt: "Some people believe that working from home is better for employees, while others think it harms productivity and teamwork.\n\nDiscuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.", minWords: 250, timeLimitMin: 40, usage: "practice" },
  { key: "t2-university-free", taskType: "task2", title: "Task 2: Free University Education", prompt: "University education should be free for all students.\n\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.", minWords: 250, timeLimitMin: 40, usage: "practice" },
  { key: "t2-traffic", taskType: "task2", title: "Task 2: Traffic Congestion", prompt: "Traffic congestion is a growing problem in many large cities.\n\nWhat are the causes of this problem, and what measures could be taken to solve it?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.", minWords: 250, timeLimitMin: 40, usage: "mock" },
  { key: "t2-diag-online", taskType: "task2", title: "Task 2: Online Learning", prompt: "Online courses are replacing traditional classroom learning.\n\nDo the advantages of this development outweigh the disadvantages?\n\nWrite at least 250 words.", minWords: 250, timeLimitMin: 40, usage: "diagnostic" },
];

// ───────── Speaking prompts ─────────
export const SPEAKING_PROMPTS = [
  { part: 1, topic: "Introduction", prompt: "Can you tell me a little about yourself — where you are from and what you do?", speakSec: 45, usage: "diagnostic" },
  { part: 1, topic: "Hometown", prompt: "What do you like most about your hometown?", speakSec: 45, usage: "practice" },
  { part: 1, topic: "Studies/Work", prompt: "Do you prefer studying in the morning or in the evening? Why?", speakSec: 45, usage: "practice" },
  { part: 1, topic: "Free time", prompt: "What do you usually do at the weekend?", speakSec: 45, usage: "practice" },
  { part: 1, topic: "Technology", prompt: "How often do you use your phone, and what for?", speakSec: 45, usage: "practice" },
  { part: 2, topic: "A useful skill", prompt: "Describe a skill you learned that has been useful to you.", bullets: ["what the skill is", "when and how you learned it", "how often you use it", "and explain why it is useful to you"], prepSec: 60, speakSec: 120, usage: "practice" },
  { part: 2, topic: "A memorable journey", prompt: "Describe a journey you remember well.", bullets: ["where you went", "who you travelled with", "what happened during the journey", "and explain why you remember it"], prepSec: 60, speakSec: 120, usage: "practice" },
  { part: 2, topic: "A helpful person", prompt: "Describe a person who has helped you in your studies or work.", bullets: ["who this person is", "how you know them", "how they helped you", "and explain how you felt about their help"], prepSec: 60, speakSec: 120, usage: "mock" },
  { part: 3, topic: "Skills & education", prompt: "Do you think schools teach the practical skills young people need today? Why or why not?", speakSec: 90, usage: "practice" },
  { part: 3, topic: "Travel", prompt: "How has tourism changed in your country over the last twenty years?", speakSec: 90, usage: "practice" },
  { part: 3, topic: "Work", prompt: "Will people work fewer hours in the future? What might the effects be?", speakSec: 90, usage: "mock" },
];

// ───────── Rubrics (band descriptors summarised in our own words) ─────────
export const RUBRICS = [
  {
    id: "writing-v1",
    skill: "writing",
    version: 1,
    criteria: [
      { key: "TR", name: "Task Achievement / Task Response", band7: "Addresses all parts of the task; clear position (Task 2) or clear overview (Task 1); main ideas extended and supported.", band6: "Addresses all parts though some more fully than others; relevant position; some ideas insufficiently developed.", band5: "Addresses the task only partially; position or overview unclear; limited development." },
      { key: "CC", name: "Coherence & Cohesion", band7: "Logical progression; range of cohesive devices used appropriately; clear central topic in each paragraph.", band6: "Coherent arrangement; cohesive devices effective but sometimes mechanical or faulty.", band5: "Some organisation but lacks overall progression; inadequate or overused linking." },
      { key: "LR", name: "Lexical Resource", band7: "Sufficient range with some less common items; awareness of style and collocation; occasional errors.", band6: "Adequate range; attempts less common vocabulary with some inaccuracy.", band5: "Limited range; noticeable errors in word choice and spelling." },
      { key: "GRA", name: "Grammatical Range & Accuracy", band7: "Variety of complex structures; frequent error-free sentences; good control.", band6: "Mix of simple and complex forms; some errors that rarely impede communication.", band5: "Limited range; complex sentences attempted but often inaccurate." },
    ],
  },
  {
    id: "speaking-v1",
    skill: "speaking",
    version: 1,
    criteria: [
      { key: "FC", name: "Fluency & Coherence", band7: "Speaks at length without noticeable effort; some hesitation; uses a range of connectives flexibly.", band6: "Willing to speak at length; some loss of coherence from repetition or hesitation.", band5: "Relies on repetition and slow speech to keep going; overuses some connectives." },
      { key: "LR", name: "Lexical Resource", band7: "Flexible vocabulary on a variety of topics; some idiomatic language.", band6: "Wide enough vocabulary to discuss topics at length; generally paraphrases successfully.", band5: "Manages familiar topics; limited flexibility." },
      { key: "GRA", name: "Grammatical Range & Accuracy", band7: "Range of complex structures with some flexibility; frequent error-free sentences.", band6: "Mix of simple and complex structures; errors rarely cause misunderstanding.", band5: "Basic forms reasonably accurate; limited complex structures." },
      { key: "P", name: "Pronunciation", band7: "Easy to understand; uses a range of features; L1 accent has minimal effect.", band6: "Generally understood; mixed control of features.", band5: "Some mispronunciation causes occasional difficulty." },
    ],
  },
];
