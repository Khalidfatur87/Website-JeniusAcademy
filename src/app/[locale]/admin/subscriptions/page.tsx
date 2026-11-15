import { getTranslations } from "next-intl/server";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";
import { requireSuperAdmin } from "@/lib/cms/guard";
import { listLevels, listSubscriptions, listUsers } from "@/lib/cms/queries";

/** Akses berbayar diberikan manual (pembayaran otomatis belum ada). */
export default async function SubscriptionsPage() {
  const t = await getTranslations("admin");
  const s = await requireSuperAdmin();
  if (!s) return <p className="card p-8 text-muted">{t("superOnly")}</p>;
  const [users, levels] = await Promise.all([listUsers(s.sb), listLevels(s.sb)]);
  const subscriptions = await listSubscriptions(s.sb, users);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("subscriptions.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subscriptions.subtitle")}</p>
      </div>
      <SubscriptionsManager
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
        levels={levels.filter((l) => l.price > 0)}
        subscriptions={subscriptions}
      />
    </div>
  );
}
