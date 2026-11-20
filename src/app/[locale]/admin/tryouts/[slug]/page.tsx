import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { TryoutContentEditor } from "@/components/admin/TryoutContentEditor";
import { TryoutForm } from "@/components/admin/TryoutForm";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { getEditableTryout, listLevels } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ slug: string }> };

export default async function EditTryoutPage({ params }: Props) {
  const { slug } = await params;
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const [tryout, levels] = await Promise.all([getEditableTryout(s.sb, s.viewer, slug), listLevels(s.sb)]);
  if (!tryout) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={routes.adminTryouts} className="text-sm font-semibold text-brand-ink hover:underline">
            ← {t("tryouts.back")}
          </Link>
          <h2 className="mt-2 text-2xl">{tr(tryout.title, locale)}</h2>
          <p className="text-sm text-muted">{t("tryouts.participants", { count: tryout.participants })}</p>
        </div>
        {tryout.published && (
          <Link href={routes.tryout(tryout.slug)} className="btn btn-ghost" target="_blank">
            {t("courses.view")}
          </Link>
        )}
      </div>
      <section aria-labelledby="sec-data" className="space-y-4">
        <h3 id="sec-data" className="text-xl">
          {t("tryouts.details")}
        </h3>
        <TryoutForm tryout={tryout} levels={levels} />
      </section>
      <section aria-labelledby="sec-content" className="space-y-4">
        <h3 id="sec-content" className="text-xl">
          {t("tryouts.content")}
        </h3>
        <TryoutContentEditor
          key={tryout.sections.map((x) => x.id).join(",")}
          slug={tryout.slug}
          sections={tryout.sections}
          locked={tryout.locked}
        />
      </section>
    </div>
  );
}
