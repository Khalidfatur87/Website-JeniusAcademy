import { describe, expect, it } from "vitest";
import {
  materialPath,
  materialTitle,
  nextLessonId,
  safeFileName,
  subscriptionExpiry,
  validateSubscriptionMonths,
  validateTryout,
  validateLive,
  validateAssignment,
  generateJoinCode,
  validateTryoutSections,
  parseYoutubeId,
  slugify,
  validateCourse,
  validateLessons,
  validateLevel,
  validateQuestions,
  type CourseInput,
  type LevelInput,
  type QuestionInput,
} from "./validate";

const t = (id: string, en = "") => ({ id, en });

describe("slugify", () => {
  it("mengubah judul menjadi slug", () => {
    expect(slugify("Fisika Dasar!")).toBe("fisika-dasar");
    expect(slugify("  Matematika — Kelas 7  ")).toBe("matematika-kelas-7");
    expect(slugify("Éducation àccent")).toBe("education-accent");
  });

  it("tidak berakhir dengan tanda hubung setelah dipotong", () => {
    expect(slugify("abc def", 4)).toBe("abc");
  });
});

describe("parseYoutubeId", () => {
  const ID = "y1BZBU5YXcM";
  it.each([
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=30s`,
    `youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
  ])("menerima %s", (input) => {
    expect(parseYoutubeId(input)).toBe(ID);
  });

  it.each(["", "abc", "https://vimeo.com/123456", `https://evil.com/watch?v=${ID}`])(
    "menolak %s",
    (input) => {
      expect(parseYoutubeId(input)).toBeNull();
    },
  );
});

describe("nextLessonId", () => {
  it("melanjutkan nomor tertinggi", () => {
    expect(nextLessonId([])).toBe("l1");
    expect(nextLessonId(["l1", "l3"])).toBe("l4");
    expect(nextLessonId(["intro"])).toBe("l1");
  });
});

describe("validateCourse", () => {
  const base: CourseInput = {
    slug: "sma-fisika",
    levelId: "sma",
    title: t("Fisika"),
    summary: t(""),
    teacherId: "",
    teacherName: " Bu Ani ",
    published: true,
    position: 0,
  };

  it("lolos dan merapikan input", () => {
    const r = validateCourse(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.teacherName).toBe("Bu Ani");
      expect(r.value.teacherId).toBeNull();
    }
  });

  it.each([
    [{ slug: "" }, "slugRequired"],
    [{ slug: "Fisika Dasar" }, "slugInvalid"],
    [{ slug: "a--b" }, "slugInvalid"],
    [{ levelId: "" }, "levelRequired"],
    [{ title: t("  ", "Physics") }, "titleRequired"],
  ] as const)("%o → %s", (patch, code) => {
    const r = validateCourse({ ...base, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe(code);
  });
});

describe("validateLessons", () => {
  const video = "https://youtu.be/y1BZBU5YXcM";
  const extra = { notes: t(""), freePreview: false };

  it("memberi id baru tanpa bentrok dengan id lama", () => {
    const r = validateLessons([
      { title: t("Baru"), minutes: 5, video, ...extra },
      { id: "l2", title: t("Lama"), minutes: 10, video, ...extra },
      { title: t("Baru 2"), minutes: 5, video, ...extra },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.map((l) => l.id)).toEqual(["l3", "l2", "l4"]);
  });

  it("melaporkan baris yang salah", () => {
    const r = validateLessons([
      { title: t("A"), minutes: 5, video, ...extra },
      { title: t("B"), minutes: 0, video, ...extra },
    ]);
    expect(r).toEqual({ ok: false, error: { code: "lessonMinutesInvalid", index: 1 } });
  });

  it("menolak video yang bukan YouTube", () => {
    const r = validateLessons([{ title: t("A"), minutes: 5, video: "bukan video", ...extra }]);
    expect(r).toEqual({ ok: false, error: { code: "lessonVideoInvalid", index: 0 } });
  });

  it("menyimpan catatan (dirapikan) dan status pratinjau", () => {
    const r = validateLessons([{ title: t("A"), minutes: 5, video, notes: t("  Ringkasan  "), freePreview: true }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value[0].notes.id).toBe("Ringkasan");
      expect(r.value[0].freePreview).toBe(true);
    }
  });

  it("menolak catatan terlalu panjang", () => {
    const r = validateLessons([{ title: t("A"), minutes: 5, video, notes: t("x".repeat(5001)), freePreview: false }]);
    expect(r).toEqual({ ok: false, error: { code: "lessonNotesTooLong", index: 0 } });
  });

  it("menolak id kembar", () => {
    const r = validateLessons([
      { id: "l1", title: t("A"), minutes: 5, video, ...extra },
      { id: "l1", title: t("B"), minutes: 5, video, ...extra },
    ]);
    expect(r.ok).toBe(false);
  });
});

describe("validateQuestions", () => {
  const q: QuestionInput = {
    prompt: t("1 + 1 = …"),
    options: [t("1"), t("2"), t("3")],
    answer: 1,
    explanation: t(""),
  };

  it("lolos untuk soal yang benar", () => {
    expect(validateQuestions([q]).ok).toBe(true);
  });

  it.each([
    [{ prompt: t("") }, "questionPromptRequired"],
    [{ options: [t("1")] }, "questionOptionsCount"],
    [{ options: [t("1"), t("")] , answer: 0 }, "questionOptionEmpty"],
    [{ options: [t("1"), t("1")], answer: 0 }, "questionOptionDuplicate"],
    [{ answer: 3 }, "questionAnswerInvalid"],
    [{ answer: -1 }, "questionAnswerInvalid"],
  ] as const)("%o → %s", (patch, code) => {
    const r = validateQuestions([q, { ...q, ...(patch as Partial<QuestionInput>) }]);
    expect(r).toEqual({ ok: false, error: { code, index: 1 } });
  });
});

describe("validateLevel", () => {
  const base: LevelInput = {
    id: "sma",
    name: t("SMA"),
    tagline: t(""),
    price: 499000,
    originalPrice: null,
    featured: false,
    subjects: [t("Fisika"), t("")],
    color: "#8b5cf6",
    position: 0,
  };

  it("lolos, membuang mapel kosong, warna dibakukan", () => {
    const r = validateLevel(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.subjects).toHaveLength(1);
      expect(r.value.color).toBe("#8B5CF6");
    }
  });

  it.each([
    [{ id: "SMA 1" }, "levelIdInvalid"],
    [{ name: t("") }, "levelNameRequired"],
    [{ price: -1 }, "priceInvalid"],
    [{ price: 1.5 }, "priceInvalid"],
    [{ color: "purple" }, "colorInvalid"],
  ] as const)("%o → %s", (patch, code) => {
    const r = validateLevel({ ...base, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe(code);
  });
});

describe("subscriptionExpiry", () => {
  const now = new Date("2026-01-31T10:00:00Z");

  it("tanpa batas → null", () => {
    expect(subscriptionExpiry(null, null, now)).toBeNull();
  });

  it("dihitung dari hari ini; akhir bulan tidak meluap", () => {
    expect(subscriptionExpiry(1, null, now)).toBe("2026-02-28T10:00:00.000Z");
    expect(subscriptionExpiry(12, null, now)).toBe("2027-01-31T10:00:00.000Z");
  });

  it("perpanjangan dihitung dari tanggal berakhir yang masih aktif", () => {
    expect(subscriptionExpiry(3, "2026-03-15T00:00:00Z", now)).toBe("2026-06-15T00:00:00.000Z");
  });

  it("langganan yang sudah lewat dihitung ulang dari hari ini", () => {
    expect(subscriptionExpiry(1, "2025-12-01T00:00:00Z", now)).toBe("2026-02-28T10:00:00.000Z");
  });

  it("hanya durasi yang tersedia yang diterima", () => {
    expect(validateSubscriptionMonths(3)).toBe(true);
    expect(validateSubscriptionMonths(null)).toBe(true);
    expect(validateSubscriptionMonths(2)).toBe(false);
    expect(validateSubscriptionMonths("3")).toBe(false);
  });
});

describe("materi", () => {
  it("nama file aman untuk Storage", () => {
    expect(safeFileName("Ringkasan Bab 1 (Final).PDF")).toBe("ringkasan-bab-1-final.pdf");
    expect(safeFileName("../../rahasia.pdf")).toBe("rahasia.pdf");
    expect(safeFileName("???.docx")).toBe("file.docx");
    expect(safeFileName("tanpa-ekstensi")).toBe("tanpa-ekstensi");
  });

  it("path di folder kelas/pelajaran", () => {
    expect(materialPath("sma-fisika", "l2", "Rumus.pdf", 123)).toBe("sma-fisika/l2/123-rumus.pdf");
  });

  it("judul bawaan dari nama file", () => {
    expect(materialTitle("ringkasan_bab-1.pdf")).toBe("ringkasan bab 1");
  });
});

describe("try-out", () => {
  const base = {
    slug: "to-utbk-1",
    levelId: "utbk",
    title: t("Try-out 1"),
    description: t(""),
    published: true,
    opensAt: null,
    closesAt: null,
    position: 0,
  };

  it("validasi data try-out & jadwal", () => {
    expect(validateTryout(base).ok).toBe(true);
    expect(validateTryout({ ...base, slug: "Bukan Slug" })).toEqual({ ok: false, error: { code: "slugInvalid" } });
    expect(validateTryout({ ...base, opensAt: "kemarin" })).toEqual({ ok: false, error: { code: "dateInvalid" } });
    expect(
      validateTryout({ ...base, opensAt: "2026-12-02T00:00:00Z", closesAt: "2026-12-01T00:00:00Z" }),
    ).toEqual({ ok: false, error: { code: "dateOrder" } });
  });

  const q = { prompt: t("1+1"), options: [t("1"), t("2")], answer: 1, explanation: t("") };

  it("subtes butuh judul, menit, dan soal", () => {
    expect(validateTryoutSections([])).toEqual({ ok: false, error: { code: "sectionsRequired" } });
    expect(validateTryoutSections([{ title: t("PU"), minutes: 0, questions: [q] }])).toEqual({
      ok: false,
      error: { code: "sectionMinutesInvalid", index: 0 },
    });
    expect(validateTryoutSections([{ title: t("PU"), minutes: 10, questions: [] }])).toEqual({
      ok: false,
      error: { code: "sectionQuestionsRequired", index: 0 },
    });
    const r = validateTryoutSections([{ title: t("PU"), minutes: 10, questions: [q] }]);
    expect(r.ok).toBe(true);
  });

  it("galat soal ditandai dengan nomor subtes", () => {
    const r = validateTryoutSections([
      { title: t("PU"), minutes: 10, questions: [q] },
      { title: t("PK"), minutes: 5, questions: [{ ...q, answer: 9 }] },
    ]);
    expect(r).toEqual({ ok: false, error: { code: "sectionQuestion:questionAnswerInvalid", index: 1 } });
  });
});

describe("kelas live", () => {
  const base = {
    levelId: "sma",
    courseSlug: "",
    title: t("Live Fisika"),
    description: t(""),
    startsAt: "2026-11-20T12:00:00Z",
    minutes: 60,
    hostName: "Pak Budi",
    joinUrl: "https://meet.google.com/abc-defg-hij",
    recording: "",
  };
  it("valid; rekaman dari tautan YouTube", () => {
    const r = validateLive({ ...base, recording: "https://youtu.be/y1BZBU5YXcM" });
    expect(r.ok && r.value.recordingYoutubeId).toBe("y1BZBU5YXcM");
    expect(r.ok && r.value.courseSlug).toBeNull();
  });
  it("menolak link tanpa https, durasi aneh, rekaman bukan YouTube", () => {
    expect(validateLive({ ...base, joinUrl: "http://zoom.us/x" })).toEqual({ ok: false, error: { code: "joinUrlInvalid" } });
    expect(validateLive({ ...base, minutes: 5 })).toEqual({ ok: false, error: { code: "liveMinutesInvalid" } });
    expect(validateLive({ ...base, recording: "bukan video" })).toEqual({ ok: false, error: { code: "lessonVideoInvalid" } });
    expect(validateLive({ ...base, startsAt: "" })).toEqual({ ok: false, error: { code: "dateInvalid" } });
  });
});

describe("mode sekolah", () => {
  it("kode gabung 6 karakter tanpa huruf/angka yang mirip", () => {
    const code = generateJoinCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(generateJoinCode(6, () => 0)).toBe("AAAAAA");
  });
  it("tugas pelajaran wajib memilih pelajaran", () => {
    const base = { title: "Tonton", instructions: "", kind: "lesson" as const, courseSlug: "sma-fisika", lessonId: null, dueAt: null };
    expect(validateAssignment(base)).toEqual({ ok: false, error: { code: "lessonRequired" } });
    const r = validateAssignment({ ...base, kind: "quiz", lessonId: "l1" });
    expect(r.ok && r.value.lessonId).toBeNull();
    expect(validateAssignment({ ...base, lessonId: "l2", dueAt: "xx" })).toEqual({ ok: false, error: { code: "dateInvalid" } });
  });
});
