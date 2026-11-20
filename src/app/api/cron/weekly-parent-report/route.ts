import { siteConfig } from "@/config/site";
import { buildParentDigests, type DigestRow } from "@/lib/parent-digest";
import { createAdminClient, isCronRequest } from "@/lib/supabase/admin";

/**
 * Email ringkasan belajar mingguan ke orang tua (jadwal di vercel.json).
 * Butuh env: CRON_SECRET, SUPABASE_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM
 * (mis. "JeniusAcademy <laporan@domain-anda.com>", domain harus terverifikasi di Resend).
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronRequest(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!sb || !apiKey || !from) return Response.json({ skipped: "not configured" });

  const { data, error } = await sb.rpc("weekly_parent_digest");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mails = buildParentDigests(data as DigestRow[], siteConfig.name, siteConfig.url);
  let sent = 0;
  let failed = 0;
  for (const mail of mails) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
    }).catch(() => null);
    if (res?.ok) sent += 1;
    else failed += 1;
  }
  return Response.json({ parents: mails.length, sent, failed });
}
