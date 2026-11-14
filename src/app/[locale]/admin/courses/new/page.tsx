import { getTranslations } from "next-intl/server";
import { CourseForm } from "@/components/admin/CourseForm";
import { requireStaff } from "@/lib/cms/guard";
import { listLevels, teacherOptions } from "@/lib/cms/queries";

export default async function NewCoursePage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const [levels, teachers] = await Promise.all([listLevels(s.sb), teacherOptions(s.sb, s.viewer)]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">{t("courses.new")}</h2>
      <CourseForm levels={levels} teachers={teachers} />
    </div>
  );
}
