import { getTranslations } from "next-intl/server";
import { TryoutForm } from "@/components/admin/TryoutForm";
import { requireStaff } from "@/lib/cms/guard";
import { listLevels } from "@/lib/cms/queries";

export default async function NewTryoutPage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const levels = await listLevels(s.sb);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">{t("tryouts.new")}</h2>
      <TryoutForm levels={levels} />
    </div>
  );
}
