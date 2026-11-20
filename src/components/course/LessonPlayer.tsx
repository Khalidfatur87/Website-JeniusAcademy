"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { LessonDiscussion } from "@/components/discussion/LessonDiscussion";
import { TutorChat } from "@/components/tutor/TutorChat";
import { useAuth } from "@/lib/auth";
import { tr, type Course, type LessonContent } from "@/lib/content";
import { fetchLessonContent } from "@/lib/lesson-content";
import { LessonControls } from "./LessonControls";
import { LessonMaterials } from "./LessonMaterials";
import { LockedLesson } from "./LockedLesson";

type State = { key: string; content: LessonContent | null } | { key: string; error: true };

/**
 * Pemutar pelajaran. Video, catatan, dan materi dimuat dari database setelah
 * halaman terbuka (tidak ada di HTML statis), sehingga pelajaran berbayar
 * tidak bisa dibuka tanpa hak akses.
 */
export function LessonPlayer({
  course,
  index,
  heading,
}: {
  course: Course;
  index: number;
  heading: ReactNode;
}) {
  const t = useTranslations("lesson");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const lesson = course.lessons[index];
  const title = tr(lesson.title, locale);
  // Muat ulang saat pelajaran atau pengguna berganti (mis. setelah login).
  const key = `${course.slug}/${lesson.id}/${user?.id ?? "guest"}`;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    fetchLessonContent(course.slug, lesson.id)
      .then((content) => alive && setState({ key, content }))
      .catch(() => alive && setState({ key, error: true }));
    return () => {
      alive = false;
    };
  }, [ready, key, course.slug, lesson.id]);

  const current = state?.key === key ? state : null;
  const content = current && !("error" in current) ? current.content : null;
  const notes = content?.access ? tr(content.notes, locale) : "";

  return (
    <div className="space-y-8">
      <div>
        {!current ? (
          <div className="aspect-video animate-pulse rounded-2xl border border-line bg-surface-2" aria-busy="true">
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : "error" in current || !content ? (
          <div className="grid aspect-video place-items-center rounded-2xl border border-line bg-surface-2 p-6 text-center text-muted">
            {t("unavailable")}
          </div>
        ) : content.access ? (
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black shadow-glow">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${content.youtubeId}`}
              title={t("videoTitle", { title })}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : (
          <LockedLesson course={course} currentId={lesson.id} />
        )}

        <div className="mt-6">{heading}</div>

        {content?.access && (
          <div className="mt-6">
            <LessonControls
              slug={course.slug}
              lessonId={lesson.id}
              prevId={course.lessons[index - 1]?.id}
              nextId={course.lessons[index + 1]?.id}
            />
          </div>
        )}
      </div>

      {notes && (
        <section aria-labelledby="notes-heading" className="space-y-3">
          <h2 id="notes-heading" className="text-xl">
            {t("notes")}
          </h2>
          <div className="card whitespace-pre-line break-words p-5 leading-relaxed">{notes}</div>
        </section>
      )}

      {content?.access && content.materials.length > 0 && <LessonMaterials materials={content.materials} />}

      {content?.access && <TutorChat slug={course.slug} lessonId={lesson.id} />}

      {content?.access && <LessonDiscussion slug={course.slug} lessonId={lesson.id} />}
    </div>
  );
}
