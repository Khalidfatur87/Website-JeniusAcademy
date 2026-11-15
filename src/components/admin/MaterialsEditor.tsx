"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "@/i18n/navigation";
import { getClient } from "@/lib/auth";
import { addMaterial, deleteMaterial } from "@/lib/cms/actions";
import type { AdminMaterial } from "@/lib/cms/queries";
import { MATERIAL_MAX_BYTES, MATERIAL_TYPES, materialPath, materialTitle } from "@/lib/cms/validate";
import { formatBytes } from "@/lib/format";
import { SaveStatus, type Status } from "./fields";

/**
 * File materi satu pelajaran. File diunggah langsung dari browser ke bucket
 * privat "materials" (izin dicek Storage RLS), lalu dicatat lewat server action.
 */
export function MaterialsEditor({
  slug,
  lessonId,
  materials,
}: {
  slug: string;
  lessonId: string;
  materials: AdminMaterial[];
}) {
  const t = useTranslations("admin.materials");
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!MATERIAL_TYPES.includes(file.type)) {
      setStatus({ ok: false, error: { code: "materialType" } });
      return;
    }
    if (file.size > MATERIAL_MAX_BYTES) {
      setStatus({ ok: false, error: { code: "materialTooLarge" } });
      return;
    }
    setStatus("saving");
    start(async () => {
      const path = materialPath(slug, lessonId, file.name);
      const up = await getClient().storage.from("materials").upload(path, file, { contentType: file.type });
      if (up.error) {
        setStatus({ ok: false, error: { code: "uploadFailed" } });
        return;
      }
      const result = await addMaterial(slug, lessonId, { title: materialTitle(file.name), path, size: file.size });
      setStatus(result);
      if (input.current) input.current.value = "";
      if (result.ok) router.refresh();
    });
  };

  const remove = (m: AdminMaterial) => {
    if (!window.confirm(t("confirmDelete", { title: m.title }))) return;
    setStatus("saving");
    start(async () => {
      const result = await deleteMaterial(m.id);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("title")}</p>
      {materials.length > 0 && (
        <ul className="space-y-1.5">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <Icon name="file" size={16} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{m.title}</span>
              {m.size > 0 && <span className="text-xs text-muted">{formatBytes(m.size)}</span>}
              <button
                type="button"
                onClick={() => remove(m)}
                disabled={pending}
                aria-label={t("delete", { title: m.title })}
                className="rounded p-1 text-muted hover:text-danger"
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          id={`${id}-file`}
          type="file"
          accept={MATERIAL_TYPES.join(",")}
          className="sr-only"
          disabled={pending}
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <label htmlFor={`${id}-file`} className={`btn btn-ghost cursor-pointer ${pending ? "opacity-60" : ""}`}>
          <Icon name="upload" size={16} />
          {t("upload")}
        </label>
        <span className="text-xs text-muted">{t("hint")}</span>
        <SaveStatus status={status} />
      </div>
    </div>
  );
}
