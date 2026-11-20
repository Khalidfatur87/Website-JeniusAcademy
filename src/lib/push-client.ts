"use client";

import { getClient } from "./auth";

/** Pengingat belajar lewat notifikasi push (Web Push, butuh service worker /sw.js). */
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** Kunci VAPID base64url → Uint8Array untuk pushManager.subscribe. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export type PushError = "denied" | "unsupported" | "generic";

export async function enablePush(userId: string): Promise<PushError | null> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
    const json = sub.toJSON();
    const { error } = await getClient()
      .from("push_subscriptions")
      .upsert({ endpoint: sub.endpoint, user_id: userId, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" });
    return error ? "generic" : null;
  } catch {
    return "generic";
  }
}

export async function disablePush(): Promise<boolean> {
  const sub = await currentSubscription();
  if (!sub) return true;
  await getClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  return sub.unsubscribe();
}
