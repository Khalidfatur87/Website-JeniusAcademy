import { getTranslations } from "next-intl/server";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { requireStaff } from "@/lib/cms/guard";
import { listAdminLive, listLevels } from "@/lib/cms/queries";
import { getCourses } from "@/lib/content-server";

export default async function AdminLivePage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const [sessions, levels, courses] = await Promise.all([listAdminLive(s.sb), listLevels(s.sb), getCourses()]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("live.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("live.subtitle")}</p>
      </div>
      <LiveEditor
        sessions={sessions}
        levels={levels}
        courses={courses.map((c) => ({ slug: c.slug, title: c.title, levelId: c.levelId }))}
      />
    </div>
  );
}
