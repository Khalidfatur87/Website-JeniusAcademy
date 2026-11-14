import { getTranslations } from "next-intl/server";
import { LevelsEditor } from "@/components/admin/LevelsEditor";
import { requireSuperAdmin } from "@/lib/cms/guard";
import { listLevels } from "@/lib/cms/queries";

export default async function LevelsPage() {
  const t = await getTranslations("admin");
  const s = await requireSuperAdmin();
  if (!s) return <p className="card p-8 text-muted">{t("superOnly")}</p>;
  const levels = await listLevels(s.sb);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("levels.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("levels.subtitle")}</p>
      </div>
      <LevelsEditor levels={levels} />
    </div>
  );
}
