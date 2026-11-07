"use client";

import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Course } from "@/config/courses";
import { courseColor, lessonIds } from "@/lib/course-utils";
import { useProgress } from "@/lib/progress";

/** Progres belajar suatu kelas (dibaca dari localStorage). */
export function CourseProgress({ course }: { course: Course }) {
  const t = useTranslations("course");
  const { doneIds } = useProgress();
  const ids = lessonIds(course);
  const done = doneIds(course.slug).filter((id) => ids.includes(id)).length;
  const text = t("completedOf", { done, total: ids.length });

  return (
    <div>
      <ProgressBar
        value={ids.length ? (done / ids.length) * 100 : 0}
        label={text}
        color={courseColor(course)}
      />
      <p className="mt-1.5 text-xs text-muted">{text}</p>
    </div>
  );
}
