import { describe, expect, it } from "vitest";
import { MIN_PASSWORD, passwordStrength, validateAuth } from "./validation";

const ok = { name: "Budi", email: "budi@mail.com", password: "Abcdef1!x", confirm: "Abcdef1!x" };

describe("validateAuth", () => {
  it("login valid tidak punya galat", () => {
    expect(validateAuth("login", ok)).toEqual({});
  });

  it("login: email kosong dan format salah", () => {
    expect(validateAuth("login", { ...ok, email: "  " }).email).toBe("emailRequired");
    expect(validateAuth("login", { ...ok, email: "budi@mail" }).email).toBe("emailInvalid");
  });

  it("login: kata sandi wajib dan minimal 8 karakter", () => {
    expect(validateAuth("login", { ...ok, password: "" }).password).toBe("passwordRequired");
    expect(validateAuth("login", { ...ok, password: "a".repeat(MIN_PASSWORD - 1) }).password).toBe(
      "passwordShort",
    );
  });

  it("register: nama wajib dan konfirmasi harus sama", () => {
    expect(validateAuth("register", { ...ok, name: " " }).name).toBe("name");
    expect(validateAuth("register", { ...ok, confirm: "lain" }).confirm).toBe("confirmMismatch");
    expect(validateAuth("register", ok)).toEqual({});
  });

  it("login tidak menuntut nama maupun konfirmasi", () => {
    const e = validateAuth("login", { ...ok, name: "", confirm: "" });
    expect(e.name).toBeUndefined();
    expect(e.confirm).toBeUndefined();
  });

  it("forgot: hanya memeriksa email", () => {
    expect(validateAuth("forgot", { ...ok, password: "" })).toEqual({});
    expect(validateAuth("forgot", { ...ok, email: "" }).email).toBe("emailRequired");
  });

  it("reset: memeriksa kata sandi + konfirmasi, tanpa email", () => {
    expect(validateAuth("reset", { ...ok, email: "" })).toEqual({});
    expect(validateAuth("reset", { ...ok, confirm: "x" }).confirm).toBe("confirmMismatch");
    expect(validateAuth("reset", { ...ok, password: "pendek", confirm: "pendek" }).password).toBe(
      "passwordShort",
    );
  });
});

describe("passwordStrength", () => {
  it("kosong = 0, pendek = 1", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abc")).toBe(1);
  });

  it("semakin beragam semakin kuat", () => {
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("Abcdefgh")).toBe(2);
    expect(passwordStrength("Abcdef1!")).toBe(3);
  });
});
