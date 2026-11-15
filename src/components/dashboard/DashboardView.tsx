"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { tr, type Course, type Level } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { courseColor } from "@/lib/course-utils";
import { summarize, type CourseStat } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { attemptPercent } from "@/lib/quiz";
import { useQuizResults } from "@/lib/quiz-results";
import { routes } from "@/lib/routes";
import { useCertificates, useSubscriptions } from "@/lib/user-data";
import { StreakCard } from "./StreakCard";

function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function CourseRow({ stat }: { stat: CourseStat }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { course, done, total, percent, next, best } = stat;
  const finished = !next;

  return (
    <li className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="truncate text-lg">{tr(course.title, locale)}</h3>
        <ProgressBar
          value={percent}
          label={t("lessonsDone", { done, total })}
          color={courseColor(course)}
        />
        <p className="text-xs text-muted">
          {t("lessonsDone", { done, total })}
          {best && ` · ${t("bestScore")}: ${best.score}/${best.total}`}
        </p>
      </div>
      <Link
        href={routes.lesson(course.slug, (next ?? course.lessons[0]).id)}
        className={finished ? "btn btn-ghost" : "btn btn-primary"}
      >
        <Icon name={finished ? "check" : "play"} size={16} />
        {finished ? t("complete") : t("continue")}
      </Link>
    </li>
  );
}

export function DashboardView({ courses, levels }: { courses: Course[]; levels: Level[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { user } = useAuth();
  const { doneIds, activity } = useProgress();
  const { attempts } = useQuizResults();
  const subs = useSubscriptions();
  const certs = useCertificates();

  const s = summarize(courses, doneIds, attempts);
  const recent = attempts.slice(0, 5);

  return (
    <div className="container-page section space-y-10">
      {user ? (
        <p className="text-lg font-medium">{t("hello", { name: user.name.split(" ")[0] })}</p>
      ) : (
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted">{t("guestBanner")}</p>
          <div className="flex gap-2">
            <Link href={routes.login} className="btn btn-ghost">
              {t("login")}
            </Link>
            <Link href={routes.register} className="btn btn-primary">
              {t("register")}
            </Link>
          </div>
        </div>
      )}

      <StreakCard lessonTimes={activity} quizTimes={attempts.map((a) => a.at)} />

      <section aria-label={t("title")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("statLessons")}
          value={s.doneLessons}
          hint={`${t("of")} ${s.totalLessons}`}
        />
        <StatCard label={t("statStarted")} value={s.started.length} />
        <StatCard label={t("statCompleted")} value={s.completedCount} />
        <StatCard
          label={t("statAvgQuiz")}
          value={s.avgQuiz === null ? "–" : `${s.avgQuiz}%`}
          hint={s.avgQuiz === null ? t("noQuiz") : undefined}
        />
      </section>

      <section aria-labelledby="my-courses" className="space-y-4">
        <h2 id="my-courses" className="text-2xl">
          {t("myCourses")}
        </h2>
        {s.started.length ? (
          <ul className="space-y-3">
            {/* Yang sedang berjalan lebih dulu, lalu yang sudah tuntas. */}
            {[...s.inProgress, ...s.started.filter((x) => x.done === x.total)].map((stat) => (
              <CourseRow key={stat.course.slug} stat={stat} />
            ))}
          </ul>
        ) : (
          <div className="card space-y-3 p-8 text-center">
            <h3 className="text-xl">{t("emptyTitle")}</h3>
            <p className="text-muted">{t("emptyText")}</p>
            <Link href={routes.courses} className="btn btn-primary">
              {t("browse")}
            </Link>
          </div>
        )}
      </section>

      {user && (subs.value.length > 0 || certs.value.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {subs.value.length > 0 && (
            <section aria-labelledby="my-subs" className="space-y-4">
              <h2 id="my-subs" className="text-2xl">
                {t("mySubscriptions")}
              </h2>
              <ul className="card divide-y divide-line">
                {subs.value.map((sub) => {
                  const level = levels.find((l) => l.id === sub.levelId);
                  const active = sub.expiresAt === null || new Date(sub.expiresAt) > new Date();
                  return (
                    <li key={sub.levelId} className="flex items-center gap-3 p-4">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {level ? tr(level.name, locale) : sub.levelId}
                      </span>
                      <span className={`text-sm ${active ? "text-success" : "text-muted"}`}>
                        {sub.expiresAt === null
                          ? t("subForever")
                          : active
                            ? t("subUntil", { date: formatDate(sub.expiresAt, locale) })
                            : t("subExpired", { date: formatDate(sub.expiresAt, locale) })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {certs.value.length > 0 && (
            <section aria-labelledby="my-certs" className="space-y-4">
              <h2 id="my-certs" className="text-2xl">
                {t("myCertificates")}
              </h2>
              <ul className="card divide-y divide-line">
                {certs.value.map((c) => (
                  <li key={c.code} className="flex items-center gap-3 p-4">
                    <Icon name="award" size={20} className="shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{tr(c.courseTitle, locale)}</span>
                      <span className="block text-xs text-muted">{formatDate(c.issuedAt, locale)}</span>
                    </span>
                    <Link href={routes.certificate(c.code)} className="text-sm font-semibold text-brand-ink hover:underline">
                      {t("viewCertificate")}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section aria-labelledby="quiz-history" className="space-y-4">
        <h2 id="quiz-history" className="text-2xl">
          {t("recentQuiz")}
        </h2>
        {recent.length ? (
          <ul className="card divide-y divide-line">
            {recent.map((a, i) => {
              const course = courses.find((c) => c.slug === a.courseSlug);
              return (
                <li key={`${a.courseSlug}-${a.at}-${i}`} className="flex items-center gap-4 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {course ? tr(course.title, locale) : a.courseSlug}
                    </span>
                    <span className="block text-xs text-muted">{formatDate(a.at, locale)}</span>
                  </span>
                  <span className="font-semibold">
                    {a.score}/{a.total}{" "}
                    <span className="text-sm font-normal text-muted">({attemptPercent(a)}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">{t("noAttempts")}</p>
        )}
      </section>
    </div>
  );
}
