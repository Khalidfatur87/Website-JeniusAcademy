import { generateKeyPairSync, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { accessToken, isGone, parseServiceAccount, sendToToken, signedJwt } from "./fcm";
import { reminderMessage } from "./reminder";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const sa = {
  project_id: "demo-project",
  client_email: "push@demo-project.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};

const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());

describe("parseServiceAccount", () => {
  it("membaca JSON service account; menolak yang tidak lengkap", () => {
    expect(parseServiceAccount(JSON.stringify(sa))).toEqual(sa);
    expect(parseServiceAccount(JSON.stringify({ project_id: "x" }))).toBeNull();
    expect(parseServiceAccount("bukan json")).toBeNull();
    expect(parseServiceAccount(undefined)).toBeNull();
  });
});

describe("signedJwt", () => {
  it("klaim benar dan tanda tangan RS256 sah", () => {
    const jwt = signedJwt(sa, 1_000);
    const [h, c, s] = jwt.split(".");
    expect(decode(h)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decode(c)).toMatchObject({
      iss: sa.client_email,
      aud: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      iat: 1_000,
      exp: 4_600,
    });
    const ok = createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(s, "base64url"));
    expect(ok).toBe(true);
  });
});

describe("pengiriman", () => {
  it("menukar JWT dengan access token", async () => {
    let body = "";
    const fake = (async (_url: string, init: RequestInit) => {
      body = String(init.body);
      return Response.json({ access_token: "ya29.token" });
    }) as typeof fetch;
    expect(await accessToken(sa, fake)).toBe("ya29.token");
    expect(body).toContain("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer");
  });

  it("mengirim ke endpoint project dan mengenali token yang sudah tidak berlaku", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const reply = (status: number, json: unknown) =>
      (async (url: string, init: RequestInit) => {
        calls.push({ url, body: JSON.parse(String(init.body)) });
        return Response.json(json, { status });
      }) as typeof fetch;

    const msg = { ...reminderMessage(true, "JeniusAcademy"), route: "/home" };
    expect(await sendToToken(sa, "tok", "bearer", msg, reply(200, {}))).toBe("sent");
    expect(calls[0].url).toBe("https://fcm.googleapis.com/v1/projects/demo-project/messages:send");
    expect(calls[0].body).toMatchObject({
      message: { token: "tok", notification: { title: "JeniusAcademy" }, data: { route: "/home" } },
    });

    const unregistered = { error: { details: [{ errorCode: "UNREGISTERED" }] } };
    expect(await sendToToken(sa, "tok", "b", msg, reply(400, unregistered))).toBe("gone");
    expect(await sendToToken(sa, "tok", "b", msg, reply(404, {}))).toBe("gone");
    expect(await sendToToken(sa, "tok", "b", msg, reply(500, {}))).toBe("failed");
  });

  it("isGone", () => {
    expect(isGone(404, null)).toBe(true);
    expect(isGone(400, { error: { details: [{ errorCode: "INVALID_ARGUMENT" }] } })).toBe(false);
  });
});

describe("reminderMessage", () => {
  it("pesan berbeda jika streak masih berjalan", () => {
    expect(reminderMessage(true, "J").body).toContain("Streak");
    expect(reminderMessage(false, "J").body).toContain("Yuk belajar");
  });
});
