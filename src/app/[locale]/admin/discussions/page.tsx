import { getTranslations } from "next-intl/server";
import { QuestionsInbox } from "@/components/admin/QuestionsInbox";
import { requireStaff } from "@/lib/cms/guard";
import { listOpenQuestions } from "@/lib/cms/queries";

/** Pertanyaan siswa yang belum dijawab guru / super admin. */
export default async function DiscussionsPage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin.discussions");
  const questions = await listOpenQuestions(s.sb);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <QuestionsInbox questions={questions} />
    </div>
  );
}
