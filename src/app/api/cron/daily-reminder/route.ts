import { sendNotification, setVapidDetails } from "web-push";
import { siteConfig } from "@/config/site";
import { createAdminClient, isCronRequest } from "@/lib/supabase/admin";

/**
 * Notifikasi push pengingat belajar untuk yang belum belajar hari ini (jadwal di vercel.json).
 * Butuh env: CRON_SECRET, SUPABASE_SECRET_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
 * VAPID_SUBJECT (mis. "mailto:admin@domain-anda.com").
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronRequest(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!sb || !pub || !priv || !subject) return Response.json({ skipped: "not configured" });
  setVapidDetails(subject, pub, priv);

  const { data, error } = await sb.rpc("push_reminder_targets");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const targets = data as { endpoint: string; p256dh: string; auth: string; streak_active: boolean }[];
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (s) => {
      const payload = JSON.stringify({
        title: siteConfig.name,
        body: s.streak_active
          ? "Streak belajarmu masih jalan! Belajar 5 menit hari ini supaya tidak putus 🔥"
          : "Yuk belajar sebentar hari ini. Satu pelajaran saja sudah cukup.",
        url: "/id/dashboard",
      });
      try {
        await sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
        sent += 1;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint); // langganan sudah tidak berlaku
      }
    }),
  );
  if (gone.length) await sb.from("push_subscriptions").delete().in("endpoint", gone);
  return Response.json({ targets: targets.length, sent, removed: gone.length });
}
