import { describe, expect, it } from "vitest";
import {
  nextLessonId,
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

  it("memberi id baru tanpa bentrok dengan id lama", () => {
    const r = validateLessons([
      { title: t("Baru"), minutes: 5, video },
      { id: "l2", title: t("Lama"), minutes: 10, video },
      { title: t("Baru 2"), minutes: 5, video },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.map((l) => l.id)).toEqual(["l3", "l2", "l4"]);
  });

  it("melaporkan baris yang salah", () => {
    const r = validateLessons([
      { title: t("A"), minutes: 5, video },
      { title: t("B"), minutes: 0, video },
    ]);
    expect(r).toEqual({ ok: false, error: { code: "lessonMinutesInvalid", index: 1 } });
  });

  it("menolak video yang bukan YouTube", () => {
    const r = validateLessons([{ title: t("A"), minutes: 5, video: "bukan video" }]);
    expect(r).toEqual({ ok: false, error: { code: "lessonVideoInvalid", index: 0 } });
  });

  it("menolak id kembar", () => {
    const r = validateLessons([
      { id: "l1", title: t("A"), minutes: 5, video },
      { id: "l1", title: t("B"), minutes: 5, video },
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
