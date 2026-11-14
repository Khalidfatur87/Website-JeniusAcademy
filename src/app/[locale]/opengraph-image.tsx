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
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
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
