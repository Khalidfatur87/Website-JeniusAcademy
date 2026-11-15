"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/** Cetak / simpan sebagai PDF lewat dialog cetak browser. */
export function PrintButton() {
  const t = useTranslations("certificate");
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      <Icon name="printer" size={16} />
      {t("print")}
    </button>
  );
}
