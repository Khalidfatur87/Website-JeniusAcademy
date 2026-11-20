import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClassroomManager } from "@/components/admin/ClassroomManager";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { getClassroom, listLevels } from "@/lib/cms/queries";
import { getCourses } from "@/lib/content-server";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ id: string }> };

export default async function AdminClassroomPage({ params }: Props) {
  const { id } = await params;
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [classroom, courses, levels] = await Promise.all([getClassroom(s.sb, s.viewer, id), getCourses(), listLevels(s.sb)]);
  if (!classroom) notFound();
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.adminClassrooms} className="text-sm font-semibold text-brand-ink hover:underline">
          ← {t("classrooms.back")}
        </Link>
        <h2 className="mt-2 text-2xl">{classroom.name}</h2>
      </div>
      <ClassroomManager
        classroom={classroom}
        courses={courses.map((c) => ({ slug: c.slug, title: c.title, lessons: c.lessons }))}
        levels={levels}
        isSuperAdmin={s.viewer.role === "super_admin"}
      />
    </div>
  );
}
