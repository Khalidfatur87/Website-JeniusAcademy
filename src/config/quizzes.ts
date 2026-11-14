/**
 * BANK SOAL KUIS / QUIZ QUESTIONS
 * ------------------------------------------------------------------
 * Satu kuis per kelas, dikunci dengan `slug` kelas (lihat courses.ts).
 * Kelas tanpa entri di sini tidak menampilkan tombol kuis.
 *
 * Catatan: soal & kunci jawaban dikirim ke browser, jadi kuis ini cocok
 * untuk latihan — bukan untuk ujian bernilai/sertifikat.
 * Soal di bawah adalah CONTOH; ganti/lengkapi dengan materi asli.
 */
import type { L10n } from "./courses";

export type QuizQuestion = {
  id: string;
  prompt: L10n;
  options: L10n[];
  /** Indeks opsi yang benar (mulai dari 0). */
  answer: number;
  explanation: L10n;
};

/** Teks yang sama di semua bahasa (angka, rumus). */
const both = (s: string): L10n => ({ id: s, en: s });

export const quizzes: Record<string, QuizQuestion[]> = {
  "sd-pecahan": [
    {
      id: "q1",
      prompt: both("1/2 × 1/3 = …"),
      options: ["1/6", "2/5", "1/5", "2/3"].map(both),
      answer: 0,
      explanation: {
        id: "Kalikan pembilang dengan pembilang dan penyebut dengan penyebut: (1×1)/(2×3) = 1/6.",
        en: "Multiply numerators together and denominators together: (1×1)/(2×3) = 1/6.",
      },
    },
    {
      id: "q2",
      prompt: both("2/3 × 3/4 = …"),
      options: ["5/7", "1/4", "1/2", "6/7"].map(both),
      answer: 2,
      explanation: {
        id: "(2×3)/(3×4) = 6/12, disederhanakan menjadi 1/2.",
        en: "(2×3)/(3×4) = 6/12, which simplifies to 1/2.",
      },
    },
    {
      id: "q3",
      prompt: both("3 × 2/5 = …"),
      options: ["6/15", "6/5", "5/6", "2/15"].map(both),
      answer: 1,
      explanation: {
        id: "Tulis 3 sebagai 3/1. Maka 3/1 × 2/5 = 6/5 (atau 1 1/5).",
        en: "Write 3 as 3/1. Then 3/1 × 2/5 = 6/5 (or 1 1/5).",
      },
    },
    {
      id: "q4",
      prompt: {
        id: "Ibu punya 3/4 kg gula. Sepertiga bagian dipakai untuk membuat kue. Berapa kg gula yang dipakai?",
        en: "Mom has 3/4 kg of sugar. One third of it is used to bake a cake. How many kg of sugar are used?",
      },
      options: ["1/4 kg", "4/7 kg", "1/12 kg", "9/4 kg"].map(both),
      answer: 0,
      explanation: {
        id: "1/3 × 3/4 = 3/12 = 1/4 kg.",
        en: "1/3 × 3/4 = 3/12 = 1/4 kg.",
      },
    },
  ],

  "smp-aljabar": [
    {
      id: "q1",
      prompt: both("Sederhanakan / Simplify: 3x + 5x − 2x"),
      options: ["10x", "6x", "8x", "6"].map(both),
      answer: 1,
      explanation: {
        id: "Suku sejenis dijumlahkan: (3 + 5 − 2)x = 6x.",
        en: "Combine like terms: (3 + 5 − 2)x = 6x.",
      },
    },
    {
      id: "q2",
      prompt: {
        id: "Nilai x yang memenuhi 2x + 6 = 14 adalah …",
        en: "The value of x that satisfies 2x + 6 = 14 is …",
      },
      options: ["5", "10", "4", "3"].map(both),
      answer: 2,
      explanation: {
        id: "2x = 14 − 6 = 8, sehingga x = 4.",
        en: "2x = 14 − 6 = 8, so x = 4.",
      },
    },
    {
      id: "q3",
      prompt: {
        id: "Penyelesaian pertidaksamaan 3x > 12 adalah …",
        en: "The solution of the inequality 3x > 12 is …",
      },
      options: ["x > 4", "x < 4", "x > 9", "x > 15"].map(both),
      answer: 0,
      explanation: {
        id: "Bagi kedua ruas dengan 3 (positif, tanda tetap): x > 4.",
        en: "Divide both sides by 3 (positive, sign stays): x > 4.",
      },
    },
    {
      id: "q4",
      prompt: both("2(x + 3) = …"),
      options: ["2x + 3", "x + 6", "2x + 6", "2x + 5"].map(both),
      answer: 2,
      explanation: {
        id: "Sifat distributif: 2·x + 2·3 = 2x + 6.",
        en: "Distributive property: 2·x + 2·3 = 2x + 6.",
      },
    },
  ],

  "sma-fisika": [
    {
      id: "q1",
      prompt: {
        id: "Satuan SI untuk gaya adalah …",
        en: "The SI unit of force is the …",
      },
      options: [
        { id: "Joule", en: "Joule" },
        { id: "Watt", en: "Watt" },
        { id: "Newton", en: "Newton" },
        { id: "Pascal", en: "Pascal" },
      ],
      answer: 2,
      explanation: {
        id: "Gaya diukur dalam newton (N), 1 N = 1 kg·m/s².",
        en: "Force is measured in newtons (N), 1 N = 1 kg·m/s².",
      },
    },
    {
      id: "q2",
      prompt: {
        id: "Mobil bergerak lurus beraturan dengan kecepatan 20 m/s selama 5 s. Jarak yang ditempuh …",
        en: "A car moves at a constant 20 m/s for 5 s. The distance travelled is …",
      },
      options: ["4 m", "25 m", "100 m", "15 m"].map(both),
      answer: 2,
      explanation: {
        id: "s = v × t = 20 × 5 = 100 m.",
        en: "s = v × t = 20 × 5 = 100 m.",
      },
    },
    {
      id: "q3",
      prompt: {
        id: "Benda bermassa 2 kg mengalami percepatan 3 m/s². Gaya yang bekerja pada benda …",
        en: "A 2 kg object accelerates at 3 m/s². The force acting on it is …",
      },
      options: [
        both("6 N"),
        both("5 N"),
        { id: "1,5 N", en: "1.5 N" },
        both("9 N"),
      ],
      answer: 0,
      explanation: {
        id: "Hukum II Newton: F = m × a = 2 × 3 = 6 N.",
        en: "Newton's second law: F = m × a = 2 × 3 = 6 N.",
      },
    },
    {
      id: "q4",
      prompt: {
        id: "Gaya 10 N memindahkan benda sejauh 3 m searah gaya. Usaha yang dilakukan …",
        en: "A 10 N force moves an object 3 m in the direction of the force. The work done is …",
      },
      options: [
        both("13 J"),
        both("30 J"),
        { id: "3,3 J", en: "3.3 J" },
        both("7 J"),
      ],
      answer: 1,
      explanation: {
        id: "W = F × s = 10 × 3 = 30 J.",
        en: "W = F × s = 10 × 3 = 30 J.",
      },
    },
  ],

  "sma-trigonometri": [
    {
      id: "q1",
      prompt: both("sin 30° = …"),
      options: ["1/2", "½√3", "1", "½√2"].map(both),
      answer: 0,
      explanation: {
        id: "Sudut istimewa: sin 30° = 1/2.",
        en: "Special angle: sin 30° = 1/2.",
      },
    },
    {
      id: "q2",
      prompt: both("tan 45° = …"),
      options: ["0", "√3", "1", "1/2"].map(both),
      answer: 2,
      explanation: {
        id: "Pada 45°, sin = cos sehingga tan 45° = 1.",
        en: "At 45°, sin = cos so tan 45° = 1.",
      },
    },
    {
      id: "q3",
      prompt: both("sin² θ + cos² θ = …"),
      options: ["0", "1", "2", "tan θ"].map(both),
      answer: 1,
      explanation: {
        id: "Identitas Pythagoras: sin² θ + cos² θ = 1 untuk setiap θ.",
        en: "Pythagorean identity: sin² θ + cos² θ = 1 for every θ.",
      },
    },
    {
      id: "q4",
      prompt: {
        id: "Pada segitiga siku-siku, sisi depan sudut θ = 3 dan sisi miring = 5. Nilai sin θ = …",
        en: "In a right triangle, the side opposite θ is 3 and the hypotenuse is 5. sin θ = …",
      },
      options: ["5/3", "4/5", "3/4", "3/5"].map(both),
      answer: 3,
      explanation: {
        id: "sin θ = sisi depan / sisi miring = 3/5.",
        en: "sin θ = opposite / hypotenuse = 3/5.",
      },
    },
  ],

  "utbk-saintek": [
    {
      id: "q1",
      prompt: {
        id: "Suku berikutnya dari barisan 2, 4, 8, 16, … adalah …",
        en: "The next term of the sequence 2, 4, 8, 16, … is …",
      },
      options: ["24", "30", "32", "20"].map(both),
      answer: 2,
      explanation: {
        id: "Setiap suku dikali 2, sehingga 16 × 2 = 32.",
        en: "Each term is doubled, so 16 × 2 = 32.",
      },
    },
    {
      id: "q2",
      prompt: {
        id: "Jika 3x = 12 dan y = x + 2, maka y = …",
        en: "If 3x = 12 and y = x + 2, then y = …",
      },
      options: ["6", "4", "8", "14"].map(both),
      answer: 0,
      explanation: {
        id: "x = 4, maka y = 4 + 2 = 6.",
        en: "x = 4, so y = 4 + 2 = 6.",
      },
    },
    {
      id: "q3",
      prompt: {
        id: "Peluang muncul mata dadu genap pada pelemparan satu dadu adalah …",
        en: "The probability of rolling an even number on one die is …",
      },
      options: ["1/6", "1/3", "1/2", "2/3"].map(both),
      answer: 2,
      explanation: {
        id: "Mata genap: 2, 4, 6 → 3 dari 6 kemungkinan = 1/2.",
        en: "Even faces: 2, 4, 6 → 3 of 6 outcomes = 1/2.",
      },
    },
    {
      id: "q4",
      prompt: {
        id: "Rata-rata dari 4, 6, 8, 10, 12 adalah …",
        en: "The mean of 4, 6, 8, 10, 12 is …",
      },
      options: ["7", "8", "9", "10"].map(both),
      answer: 1,
      explanation: {
        id: "Jumlah = 40, banyak data = 5, rata-rata = 40/5 = 8.",
        en: "Sum = 40, count = 5, mean = 40/5 = 8.",
      },
    },
  ],

  "utbk-soshum": [
    {
      id: "q1",
      prompt: {
        id: "Semua mahasiswa wajib mengikuti ujian. Budi adalah mahasiswa. Kesimpulan yang tepat: …",
        en: "All students must take the exam. Budi is a student. The correct conclusion: …",
      },
      options: [
        { id: "Budi tidak wajib mengikuti ujian", en: "Budi does not have to take the exam" },
        { id: "Budi wajib mengikuti ujian", en: "Budi must take the exam" },
        { id: "Budi bukan mahasiswa", en: "Budi is not a student" },
        { id: "Hanya Budi yang wajib ujian", en: "Only Budi must take the exam" },
      ],
      answer: 1,
      explanation: {
        id: "Budi termasuk kelompok mahasiswa, sehingga aturan untuk semua mahasiswa berlaku baginya.",
        en: "Budi belongs to the group of students, so the rule for all students applies to him.",
      },
    },
    {
      id: "q2",
      prompt: {
        id: "Kalimat yang memuat gagasan pokok sebuah paragraf disebut …",
        en: "The sentence that carries the main idea of a paragraph is called the …",
      },
      options: [
        { id: "kalimat utama", en: "topic sentence" },
        { id: "kalimat penjelas", en: "supporting sentence" },
        { id: "kalimat penutup", en: "closing sentence" },
        { id: "kalimat tanya", en: "question sentence" },
      ],
      answer: 0,
      explanation: {
        id: "Kalimat utama memuat gagasan pokok; kalimat penjelas hanya mengembangkannya.",
        en: "The topic sentence states the main idea; supporting sentences only develop it.",
      },
    },
    {
      id: "q3",
      prompt: {
        id: "Dokter : Rumah sakit = Guru : …",
        en: "Doctor : Hospital = Teacher : …",
      },
      options: [
        { id: "Buku", en: "Book" },
        { id: "Sekolah", en: "School" },
        { id: "Murid", en: "Student" },
        { id: "Papan tulis", en: "Whiteboard" },
      ],
      answer: 1,
      explanation: {
        id: "Hubungannya profesi dengan tempat kerjanya: dokter di rumah sakit, guru di sekolah.",
        en: "The relation is profession to workplace: a doctor at a hospital, a teacher at a school.",
      },
    },
    {
      id: "q4",
      prompt: {
        id: "Jika hujan, maka jalan basah. Jalan tidak basah. Kesimpulannya …",
        en: "If it rains, the road gets wet. The road is not wet. Therefore …",
      },
      options: [
        { id: "Hujan", en: "It rained" },
        { id: "Tidak hujan", en: "It did not rain" },
        { id: "Jalan kering karena panas", en: "The road is dry because of the heat" },
        { id: "Tidak dapat disimpulkan", en: "Nothing can be concluded" },
      ],
      answer: 1,
      explanation: {
        id: "Jika hujan pasti basah; karena tidak basah, berarti tidak hujan (kontraposisi).",
        en: "If rain always makes it wet and it is not wet, then it did not rain (contrapositive).",
      },
    },
  ],
};

export const getQuiz = (slug: string): QuizQuestion[] | undefined => quizzes[slug];
