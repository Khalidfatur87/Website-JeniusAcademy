import { sendNotification, setVapidDetails } from "web-push";
import { siteConfig } from "@/config/site";
import { accessToken, parseServiceAccount, sendToToken } from "@/lib/fcm";
import { reminderMessage } from "@/lib/reminder";
import { createAdminClient, isCronRequest } from "@/lib/supabase/admin";

/**
 * Notifikasi push pengingat belajar untuk yang belum belajar hari ini (jadwal di vercel.json).
 * Dua jalur, masing-masing aktif jika env-nya diisi:
 * - Web (PWA, Web Push): NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 * - Aplikasi mobile (Firebase Cloud Messaging): FIREBASE_SERVICE_ACCOUNT (JSON service account).
 * Keduanya butuh CRON_SECRET dan SUPABASE_SECRET_KEY.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
type Summary = { targets: number; sent: number; removed: number } | { skipped: string } | { error: string };

async function sendWeb(sb: Admin): Promise<Summary> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return { skipped: "not configured" };
  setVapidDetails(subject, pub, priv);

  const { data, error } = await sb.rpc("push_reminder_targets");
  if (error) return { error: error.message };

  const targets = data as { endpoint: string; p256dh: string; auth: string; streak_active: boolean }[];
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (s) => {
      const payload = JSON.stringify({ ...reminderMessage(s.streak_active, siteConfig.name), url: "/id/dashboard" });
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
  return { targets: targets.length, sent, removed: gone.length };
}

async function sendApp(sb: Admin): Promise<Summary> {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!sa) return { skipped: "not configured" };

  const { data, error } = await sb.rpc("device_reminder_targets");
  if (error) return { error: error.message };
  const targets = data as { token: string; streak_active: boolean }[];
  if (!targets.length) return { targets: 0, sent: 0, removed: 0 };

  let bearer: string;
  try {
    bearer = await accessToken(sa);
  } catch (e) {
    return { error: (e as Error).message };
  }
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (t) => {
      const result = await sendToToken(sa, t.token, bearer, {
        ...reminderMessage(t.streak_active, siteConfig.name),
        route: "/home",
      }).catch(() => "failed" as const);
      if (result === "sent") sent += 1;
      if (result === "gone") gone.push(t.token); // aplikasi dihapus / token diganti
    }),
  );
  if (gone.length) await sb.from("device_tokens").delete().in("token", gone);
  return { targets: targets.length, sent, removed: gone.length };
}

export async function GET(req: Request) {
  if (!isCronRequest(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  if (!sb) return Response.json({ skipped: "not configured" });
  const [web, app] = await Promise.all([sendWeb(sb), sendApp(sb)]);
  return Response.json({ web, app });
}
