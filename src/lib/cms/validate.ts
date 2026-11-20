import { locales } from "@/config/site";
import type { L10n } from "@/lib/content";

/**
 * VALIDASI INPUT CMS (fungsi murni, dipakai di server action dan dites).
 * Bahasa Indonesia wajib diisi; bahasa lain opsional (fallback ke Indonesia).
 * Database juga punya CHECK constraint; validasi ini memberi pesan yang jelas lebih dulu.
 */

/** `code` → pesan di messages: admin.errors.<code>. `index` = nomor baris (mulai 0) untuk daftar. */
export type ValidationError = { code: string; index?: number };
type Result<T> = { ok: true; value: T } | { ok: false; error: ValidationError };

export type CourseInput = {
  slug: string;
  levelId: string;
  title: L10n;
  summary: L10n;
  /** Akun guru pemilik (diabaikan jika yang menyimpan adalah guru). */
  teacherId: string | null;
  teacherName: string;
  published: boolean;
  position: number;
};

export type LessonInput = {
  /** Kosong untuk pelajaran baru. */
  id?: string;
  title: L10n;
  minutes: number;
  /** ID video atau tautan YouTube. */
  video: string;
  /** Catatan / ringkasan materi (teks biasa). */
  notes: L10n;
  /** Pratinjau gratis untuk semua orang. */
  freePreview: boolean;
};

export type QuestionInput = {
  /** Kosong untuk soal baru. */
  id?: string;
  prompt: L10n;
  options: L10n[];
  answer: number;
  explanation: L10n;
};

export type LevelInput = {
  id: string;
  name: L10n;
  tagline: L10n;
  price: number;
  originalPrice: number | null;
  featured: boolean;
  subjects: L10n[];
  color: string;
  position: number;
};

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LESSON_ID_RE = /^[a-z0-9-]{1,40}$/;
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const fail = <T>(code: string, index?: number): Result<T> => ({
  ok: false,
  error: index === undefined ? { code } : { code, index },
});

/** Merapikan teks multibahasa: trim, dan semua bahasa selalu ada. */
export function cleanL10n(text: Partial<L10n> | null | undefined): L10n {
  return Object.fromEntries(
    locales.map((l) => [l, (text?.[l] ?? "").trim()]),
  ) as L10n;
}

const filled = (text: L10n) => text.id.trim() !== "";
const isWholeNumber = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

/** Judul → slug URL, mis. "Fisika Dasar!" → "fisika-dasar". */
export function slugify(text: string, max = 60): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/** Menerima ID video atau tautan YouTube (watch, youtu.be, embed, shorts) → ID 11 karakter, atau null. */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (YOUTUBE_ID_RE.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    id = url.searchParams.get("v");
    const m = url.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
    if (!id && m) id = m[2];
  }
  return id && YOUTUBE_ID_RE.test(id) ? id : null;
}

/** Id baru untuk pelajaran: l<angka> berikutnya yang belum dipakai. */
export function nextLessonId(existing: string[]): string {
  const used = new Set(existing);
  let n = existing.reduce((max, id) => {
    const m = /^l(\d+)$/.exec(id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  do n += 1;
  while (used.has(`l${n}`));
  return `l${n}`;
}

export function validateCourse(input: CourseInput): Result<CourseInput> {
  const slug = input.slug.trim();
  if (!slug) return fail("slugRequired");
  if (slug.length > 60 || !SLUG_RE.test(slug)) return fail("slugInvalid");
  if (!input.levelId) return fail("levelRequired");
  const title = cleanL10n(input.title);
  if (!filled(title)) return fail("titleRequired");
  if (Object.values(title).some((t) => t.length > 120)) return fail("titleTooLong");
  const summary = cleanL10n(input.summary);
  if (Object.values(summary).some((t) => t.length > 400)) return fail("summaryTooLong");
  const teacherName = input.teacherName.trim();
  if (teacherName.length > 80) return fail("teacherNameTooLong");
  if (!isWholeNumber(input.position)) return fail("positionInvalid");

  return {
    ok: true,
    value: {
      slug,
      levelId: input.levelId,
      title,
      summary,
      teacherId: input.teacherId || null,
      teacherName,
      published: Boolean(input.published),
      position: input.position,
    },
  };
}

export type CleanLesson = {
  id: string;
  title: L10n;
  minutes: number;
  youtubeId: string;
  notes: L10n;
  freePreview: boolean;
};

export const NOTES_MAX = 5000;

/** Memvalidasi daftar pelajaran (urutan = urutan tampil) dan memberi id untuk pelajaran baru. */
export function validateLessons(list: LessonInput[]): Result<CleanLesson[]> {
  if (list.length > 200) return fail("tooManyLessons");
  const existing = list.flatMap((l) => (l.id ? [l.id] : []));
  if (new Set(existing).size !== existing.length) return fail("lessonIdDuplicate");
  const ids = [...existing];
  const out: CleanLesson[] = [];

  for (const [i, l] of list.entries()) {
    if (l.id && !LESSON_ID_RE.test(l.id)) return fail("lessonIdInvalid", i);
    const title = cleanL10n(l.title);
    if (!filled(title)) return fail("lessonTitleRequired", i);
    if (Object.values(title).some((t) => t.length > 120)) return fail("titleTooLong", i);
    if (!isWholeNumber(l.minutes) || l.minutes < 1 || l.minutes > 600) {
      return fail("lessonMinutesInvalid", i);
    }
    const youtubeId = parseYoutubeId(l.video);
    if (!youtubeId) return fail("lessonVideoInvalid", i);
    const notes = cleanL10n(l.notes);
    if (Object.values(notes).some((t) => t.length > NOTES_MAX)) return fail("lessonNotesTooLong", i);
    let id = l.id;
    if (!id) {
      id = nextLessonId(ids);
      ids.push(id);
    }
    out.push({ id, title, minutes: l.minutes, youtubeId, notes, freePreview: Boolean(l.freePreview) });
  }
  return { ok: true, value: out };
}

export type CleanQuestion = {
  id?: string;
  prompt: L10n;
  options: L10n[];
  answer: number;
  explanation: L10n;
};

export function validateQuestions(list: QuestionInput[]): Result<CleanQuestion[]> {
  if (list.length > 100) return fail("tooManyQuestions");
  const out: CleanQuestion[] = [];

  for (const [i, q] of list.entries()) {
    const prompt = cleanL10n(q.prompt);
    if (!filled(prompt)) return fail("questionPromptRequired", i);
    if (Object.values(prompt).some((t) => t.length > 1000)) return fail("questionTooLong", i);
    const options = q.options.map(cleanL10n);
    if (options.length < 2 || options.length > 6) return fail("questionOptionsCount", i);
    if (options.some((o) => !filled(o))) return fail("questionOptionEmpty", i);
    for (const l of locales) {
      const texts = options.map((o) => o[l]).filter(Boolean);
      if (new Set(texts).size !== texts.length) return fail("questionOptionDuplicate", i);
    }
    if (!isWholeNumber(q.answer) || q.answer < 0 || q.answer >= options.length) {
      return fail("questionAnswerInvalid", i);
    }
    const explanation = cleanL10n(q.explanation);
    if (Object.values(explanation).some((t) => t.length > 2000)) return fail("questionTooLong", i);
    out.push({ ...(q.id ? { id: q.id } : {}), prompt, options, answer: q.answer, explanation });
  }
  return { ok: true, value: out };
}

export function validateLevel(input: LevelInput): Result<LevelInput> {
  const id = input.id.trim();
  if (!id) return fail("levelIdRequired");
  if (id.length > 30 || !SLUG_RE.test(id)) return fail("levelIdInvalid");
  const name = cleanL10n(input.name);
  if (!filled(name)) return fail("levelNameRequired");
  if (!isWholeNumber(input.price) || input.price < 0) return fail("priceInvalid");
  if (
    input.originalPrice !== null &&
    (!isWholeNumber(input.originalPrice) || input.originalPrice < 0)
  ) {
    return fail("priceInvalid");
  }
  if (!COLOR_RE.test(input.color)) return fail("colorInvalid");
  const subjects = input.subjects.map(cleanL10n).filter(filled);
  if (!isWholeNumber(input.position)) return fail("positionInvalid");

  return {
    ok: true,
    value: {
      id,
      name,
      tagline: cleanL10n(input.tagline),
      price: input.price,
      originalPrice: input.originalPrice,
      featured: Boolean(input.featured),
      subjects,
      color: input.color.toUpperCase(),
      position: input.position,
    },
  };
}

// ---- langganan -------------------------------------------------------------

/** Pilihan durasi langganan (bulan); null = tanpa batas waktu. */
export const SUBSCRIPTION_MONTHS = [1, 3, 6, 12] as const;

/**
 * Tanggal berakhir langganan. Jika masih ada langganan aktif, durasi
 * ditambahkan dari tanggal berakhirnya (perpanjangan), bukan dari hari ini.
 */
export function subscriptionExpiry(
  months: number | null,
  currentExpiry: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (months === null) return null;
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const base = current && current > now ? current : now;
  const d = new Date(base);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  // 31 Jan + 1 bulan → akhir Februari, bukan 3 Maret.
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d.toISOString();
}

export function validateSubscriptionMonths(months: unknown): months is number | null {
  return months === null || (SUBSCRIPTION_MONTHS as readonly number[]).includes(months as number);
}

// ---- materi ------------------------------------------------------------------

export const MATERIAL_MAX_BYTES = 20 * 1024 * 1024;
export const MATERIAL_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

/** Nama file aman untuk Storage: huruf/angka/titik/tanda hubung, ekstensi dipertahankan. */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const slug = slugify(base, 60) || "file";
  return ext ? `${slug}.${ext}` : slug;
}

/** Path materi di bucket: <slug>/<id pelajaran>/<waktu>-<nama aman>. */
export const materialPath = (slug: string, lessonId: string, fileName: string, now = Date.now()) =>
  `${slug}/${lessonId}/${now}-${safeFileName(fileName)}`;

/** Judul materi bawaan dari nama file, mis. "ringkasan-bab-1.pdf" → "ringkasan bab 1". */
export function materialTitle(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName).replace(/[_-]+/g, " ").trim();
  return (base || fileName).slice(0, 120);
}

// ---- try-out -------------------------------------------------------------------

export type TryoutInput = {
  slug: string;
  levelId: string;
  title: L10n;
  description: L10n;
  published: boolean;
  /** ISO atau kosong. */
  opensAt: string | null;
  closesAt: string | null;
  position: number;
};

export type TryoutSectionInput = { title: L10n; minutes: number; questions: QuestionInput[] };

const isoOrNull = (v: string | null) => {
  if (!v) return { ok: true as const, value: null };
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? { ok: false as const } : { ok: true as const, value: d.toISOString() };
};

export function validateTryout(input: TryoutInput): Result<TryoutInput> {
  const slug = input.slug.trim();
  if (!slug) return fail("slugRequired");
  if (slug.length > 60 || !SLUG_RE.test(slug)) return fail("slugInvalid");
  if (!input.levelId) return fail("levelRequired");
  const title = cleanL10n(input.title);
  if (!filled(title)) return fail("titleRequired");
  if (Object.values(title).some((t) => t.length > 120)) return fail("titleTooLong");
  const description = cleanL10n(input.description);
  if (Object.values(description).some((t) => t.length > 2000)) return fail("summaryTooLong");
  const opens = isoOrNull(input.opensAt);
  const closes = isoOrNull(input.closesAt);
  if (!opens.ok || !closes.ok) return fail("dateInvalid");
  if (opens.value && closes.value && opens.value >= closes.value) return fail("dateOrder");
  if (!isWholeNumber(input.position)) return fail("positionInvalid");
  return {
    ok: true,
    value: {
      slug,
      levelId: input.levelId,
      title,
      description,
      published: Boolean(input.published),
      opensAt: opens.value,
      closesAt: closes.value,
      position: input.position,
    },
  };
}

export type CleanTryoutSection = { title: L10n; minutes: number; questions: CleanQuestion[] };

/** Subtes: 1–20 subtes, 1–300 menit, 1–100 soal tiap subtes. `index` galat = nomor subtes. */
export function validateTryoutSections(list: TryoutSectionInput[]): Result<CleanTryoutSection[]> {
  if (list.length === 0) return fail("sectionsRequired");
  if (list.length > 20) return fail("tooManySections");
  const out: CleanTryoutSection[] = [];
  for (const [i, s] of list.entries()) {
    const title = cleanL10n(s.title);
    if (!filled(title)) return fail("sectionTitleRequired", i);
    if (!isWholeNumber(s.minutes) || s.minutes < 1 || s.minutes > 300) return fail("sectionMinutesInvalid", i);
    if (s.questions.length === 0) return fail("sectionQuestionsRequired", i);
    const q = validateQuestions(s.questions);
    if (!q.ok) return fail(`section${q.error.index !== undefined ? "Question" : ""}:${q.error.code}`, i);
    out.push({ title, minutes: s.minutes, questions: q.value });
  }
  return { ok: true, value: out };
}

// ---- kelas live ----------------------------------------------------------------

export type LiveInput = {
  levelId: string;
  courseSlug: string | null;
  title: L10n;
  description: L10n;
  startsAt: string;
  minutes: number;
  hostName: string;
  joinUrl: string;
  /** ID / tautan YouTube rekaman (boleh kosong). */
  recording: string;
};

export type CleanLive = Omit<LiveInput, "recording"> & { recordingYoutubeId: string };

export function validateLive(input: LiveInput): Result<CleanLive> {
  if (!input.levelId) return fail("levelRequired");
  const title = cleanL10n(input.title);
  if (!filled(title)) return fail("titleRequired");
  if (Object.values(title).some((t) => t.length > 120)) return fail("titleTooLong");
  const description = cleanL10n(input.description);
  if (Object.values(description).some((t) => t.length > 2000)) return fail("summaryTooLong");
  const start = new Date(input.startsAt);
  if (!input.startsAt || Number.isNaN(start.getTime())) return fail("dateInvalid");
  if (!isWholeNumber(input.minutes) || input.minutes < 10 || input.minutes > 480) return fail("liveMinutesInvalid");
  const hostName = input.hostName.trim();
  if (hostName.length > 80) return fail("teacherNameTooLong");
  const joinUrl = input.joinUrl.trim();
  if (joinUrl && !/^https:\/\/\S+$/.test(joinUrl)) return fail("joinUrlInvalid");
  const recording = input.recording.trim();
  const recordingYoutubeId = recording ? parseYoutubeId(recording) : "";
  if (recordingYoutubeId === null) return fail("lessonVideoInvalid");
  return {
    ok: true,
    value: {
      levelId: input.levelId,
      courseSlug: input.courseSlug || null,
      title,
      description,
      startsAt: start.toISOString(),
      minutes: input.minutes,
      hostName,
      joinUrl,
      recordingYoutubeId,
    },
  };
}

// ---- mode sekolah ---------------------------------------------------------------

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I yang mirip

/** Kode gabung kelas, mis. "K7M2QX". */
export function generateJoinCode(length = 6, random: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < length; i++) s += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return s;
}

export type AssignmentInput = {
  title: string;
  instructions: string;
  kind: "lesson" | "quiz" | "course";
  courseSlug: string;
  lessonId: string | null;
  dueAt: string | null;
};

export function validateAssignment(input: AssignmentInput): Result<AssignmentInput> {
  const title = input.title.trim();
  if (!title) return fail("titleRequired");
  if (title.length > 120) return fail("titleTooLong");
  const instructions = input.instructions.trim();
  if (instructions.length > 2000) return fail("summaryTooLong");
  if (!["lesson", "quiz", "course"].includes(input.kind)) return fail("invalid");
  if (!input.courseSlug) return fail("courseRequired");
  if (input.kind === "lesson" && !input.lessonId) return fail("lessonRequired");
  let dueAt: string | null = null;
  if (input.dueAt) {
    const d = new Date(input.dueAt);
    if (Number.isNaN(d.getTime())) return fail("dateInvalid");
    dueAt = d.toISOString();
  }
  return {
    ok: true,
    value: {
      title,
      instructions,
      kind: input.kind,
      courseSlug: input.courseSlug,
      lessonId: input.kind === "lesson" ? input.lessonId : null,
      dueAt,
    },
  };
}
