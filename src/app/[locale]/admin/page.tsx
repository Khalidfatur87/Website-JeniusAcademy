import { redirect } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return redirect({ href: routes.adminCourses, locale });
}
