import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Gambar pratinjau saat tautan dibagikan (WhatsApp, X, Facebook, dll.). */
export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const { first, second } = siteConfig.wordmark;
  const tagline = t("title").split(" — ")[1] ?? t("title");
  const mark = siteConfig.logo.mark;
  const markData = mark.src
    ? `data:image/png;base64,${(await readFile(join(process.cwd(), "public", mark.src))).toString("base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          color: "#ffffff",
          background: `linear-gradient(135deg, ${siteConfig.colors.primary}, #07101f)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          {markData && (
            <div
              style={{
                display: "flex",
                marginRight: 20,
                padding: "8px 12px",
                borderRadius: 18,
                background: "#ffffff",
              }}
            >
              <img src={markData} width={Math.round((56 * mark.width) / mark.height)} height={56} alt="" />
            </div>
          )}
          <span>{first}</span>
          <span style={{ color: siteConfig.colors.accent }}>{second}</span>
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>
          {tagline}
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 32, opacity: 0.85, lineHeight: 1.4 }}>
          {t("description")}
        </div>
      </div>
    ),
    size,
  );
}
