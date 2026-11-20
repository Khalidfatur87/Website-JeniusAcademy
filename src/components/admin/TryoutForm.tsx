"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { deleteTryout, saveTryout } from "@/lib/cms/actions";
import type { AdminTryout } from "@/lib/cms/queries";
import { slugify } from "@/lib/cms/validate";
import { tr, type Level } from "@/lib/content";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import { routes } from "@/lib/routes";
import { emptyL10n, Field, L10nInput, SaveStatus, type Status } from "./fields";

/** Data try-out: judul, slug, jenjang (menentukan siapa yang berhak), jadwal, status terbit. */
export function TryoutForm({ tryout, levels }: { tryout?: AdminTryout; levels: Level[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const creating = !tryout;
  const [title, setTitle] = useState(tryout?.title ?? emptyL10n());
  const [slug, setSlug] = useState(tryout?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [levelId, setLevelId] = useState(tryout?.levelId ?? levels.find((l) => l.id === "utbk")?.id ?? levels[0]?.id ?? "");
  const [description, setDescription] = useState(tryout?.description ?? emptyL10n());
  const [opensAt, setOpensAt] = useState(toLocalInput(tryout?.opensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(tryout?.closesAt));
  const [published, setPublished] = useState(tryout?.published ?? false);
  const [position, setPosition] = useState(tryout?.position ?? 0);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    start(async () => {
      const result = await saveTryout(
        {
          slug,
          levelId,
          title,
          description,
          published,
          opensAt: fromLocalInput(opensAt),
          closesAt: fromLocalInput(closesAt),
          position,
        },
        creating ? "create" : "update",
      );
      setStatus(result);
      if (result.ok) {
        if (creating) router.push(routes.adminTryout(slug.trim()));
        else router.refresh();
      }
    });
  };

  const remove = () => {
    if (!tryout || !window.confirm(t("tryouts.confirmDelete", { slug: tryout.slug }))) return;
    start(async () => {
      const result = await deleteTryout(tryout.slug);
      if (result.ok) router.push(routes.adminTryouts);
      else setStatus(result);
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <L10nInput
        label={t("course.title")}
        value={title}
        onChange={(next) => {
          setTitle(next);
          if (creating && !slugTouched) setSlug(slugify(next.id));
        }}
        required
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("course.slug")} htmlFor={`${id}-slug`} hint={creating ? t("course.slugHint") : t("course.slugLocked")}>
          <input
            id={`${id}-slug`}
            className="field"
            value={slug}
            readOnly={!creating}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </Field>
        <Field label={t("course.level")} htmlFor={`${id}-level`} hint={t("tryouts.levelHint")}>
          <select id={`${id}-level`} className="field" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {tr(l.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("tryouts.opensAt")} htmlFor={`${id}-open`} hint={t("tryouts.scheduleHint")}>
          <input id={`${id}-open`} type="datetime-local" className="field" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
        </Field>
        <Field label={t("tryouts.closesAt")} htmlFor={`${id}-close`}>
          <input id={`${id}-close`} type="datetime-local" className="field" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </Field>
        <Field label={t("course.position")} htmlFor={`${id}-pos`} hint={t("course.positionHint")}>
          <input id={`${id}-pos`} type="number" className="field" value={position} onChange={(e) => setPosition(Number(e.target.value))} />
        </Field>
      </div>
      <L10nInput label={t("tryouts.description")} value={description} onChange={setDescription} multiline />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>
          <span className="font-medium">{t("course.published")}</span>
          <span className="block text-xs text-muted">{t("tryouts.publishedHint")}</span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {creating ? t("tryouts.create") : t("save")}
        </button>
        {!creating && (
          <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost border-danger text-danger">
            {t("tryouts.delete")}
          </button>
        )}
        <SaveStatus status={status} />
      </div>
    </form>
  );
}
