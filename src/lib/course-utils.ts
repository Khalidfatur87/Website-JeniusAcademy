import { tr, type Course, type Level } from "@/lib/content";

/** Gradien kartu/header sesuai warna jenjang. */
export const levelGradient = (color: string) =>
  `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #0b1b33))`;

export const courseMinutes = (course: Course) =>
  course.lessons.reduce((sum, l) => sum + l.minutes, 0);

export const lessonIds = (course: Course) => course.lessons.map((l) => l.id);

export const courseColor = (course: Course) => course.level.color;

/** Opsi filter jenjang ("Semua" + tiap jenjang) untuk FilterPills. */
export const levelFilterOptions = (levels: Level[], locale: string, allLabel: string) => [
  { id: "all", label: allLabel },
  ...levels.map((l) => ({ id: l.id, label: tr(l.name, locale) })),
];
