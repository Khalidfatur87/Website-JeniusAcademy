import { getTranslations } from "next-intl/server";
import { UsersTable } from "@/components/admin/UsersTable";
import { requireSuperAdmin } from "@/lib/cms/guard";
import { listUsers } from "@/lib/cms/queries";

export default async function UsersPage() {
  const t = await getTranslations("admin");
  const s = await requireSuperAdmin();
  if (!s) return <p className="card p-8 text-muted">{t("superOnly")}</p>;
  const users = await listUsers(s.sb);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("users.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("users.subtitle")}</p>
      </div>
      <UsersTable users={users} selfId={s.viewer.id} />
    </div>
  );
}
