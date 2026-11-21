import { createSign } from "node:crypto";

/**
 * FIREBASE CLOUD MESSAGING (HTTP v1) untuk push ke aplikasi mobile — HANYA server.
 * Env: FIREBASE_SERVICE_ACCOUNT = isi file JSON service account (Firebase Console →
 * Project settings → Service accounts → Generate new private key). Rahasia: jangan diberi
 * awalan NEXT_PUBLIC_.
 */

export type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!j.project_id || !j.client_email || !j.private_key) return null;
    return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key };
  } catch {
    return null;
  }
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** JWT bertanda tangan RS256 untuk ditukar dengan access token Google (berlaku 1 jam). */
export function signedJwt(sa: ServiceAccount, nowSeconds: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key);
  return `${header}.${claims}.${b64url(signature)}`;
}

export async function accessToken(sa: ServiceAccount, fetcher: typeof fetch = fetch): Promise<string> {
  const res = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt(sa, Math.floor(Date.now() / 1000)),
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export type SendResult = "sent" | "gone" | "failed";

/** Token tidak berlaku lagi (aplikasi dihapus / token diganti) → hapus dari database. */
export function isGone(status: number, body: unknown): boolean {
  if (status === 404) return true;
  const details = (body as { error?: { details?: { errorCode?: string }[] } })?.error?.details ?? [];
  return details.some((d) => d.errorCode === "UNREGISTERED");
}

export async function sendToToken(
  sa: ServiceAccount,
  token: string,
  bearer: string,
  message: { title: string; body: string; route?: string },
  fetcher: typeof fetch = fetch,
): Promise<SendResult> {
  const res = await fetcher(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: message.title, body: message.body },
        data: message.route ? { route: message.route } : undefined,
        android: { priority: "high", ttl: "3600s" },
      },
    }),
  });
  if (res.ok) return "sent";
  const body = await res.json().catch(() => null);
  return isGone(res.status, body) ? "gone" : "failed";
}
