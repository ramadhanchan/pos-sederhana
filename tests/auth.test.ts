import { test, expect } from "bun:test";
import { hashPassword, verifyPassword, createSession, verifySession } from "../lib/auth";

test("hash + verify password roundtrip", async () => {
  const h = await hashPassword("admin123");
  expect(await verifyPassword("admin123", h)).toBe(true);
  expect(await verifyPassword("salah", h)).toBe(false);
});
test("createSession → verifySession mengembalikan userId yang sama", async () => {
  const token = await createSession(1);
  expect(await verifySession(token)).toBe(1);
});
test("token yang dipalsukan mengembalikan null", async () => {
  const token = await createSession(1);
  const tampered = token.slice(0, -3) + "aaa";
  expect(await verifySession(tampered)).toBeNull();
});
test("token format rusak mengembalikan null", async () => {
  expect(await verifySession("bukan-token")).toBeNull();
});
test("token kedaluwarsa mengembalikan null", async () => {
  const token = await createSession(1, -1000); // ttl negatif (override param)
  expect(await verifySession(token)).toBeNull();
});
