"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { deleteCourse } from "@/lib/cms/actions";
import { routes } from "@/lib/routes";
import { SaveStatus, type Status } from "./fields";

export function DeleteCourseButton({ slug }: { slug: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const onClick = () => {
    if (!window.confirm(t("course.confirmDelete", { slug }))) return;
    start(async () => {
      const result = await deleteCourse(slug);
      if (result.ok) router.push(routes.adminCourses);
      else setStatus(result);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn btn-ghost border-danger text-danger"
      >
        {t("course.delete")}
      </button>
      <SaveStatus status={status} />
    </div>
  );
}
