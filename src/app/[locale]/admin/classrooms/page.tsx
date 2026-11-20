import { getTranslations } from "next-intl/server";
import { ClassroomsList } from "@/components/admin/ClassroomsList";
import { requireStaff } from "@/lib/cms/guard";
import { listClassrooms } from "@/lib/cms/queries";

export default async function AdminClassroomsPage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const classrooms = await listClassrooms(s.sb, s.viewer);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("classrooms.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("classrooms.subtitle")}</p>
      </div>
      <ClassroomsList classrooms={classrooms} />
    </div>
  );
}
