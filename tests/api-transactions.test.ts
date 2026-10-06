process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`;
import { GET, POST } from "../app/api/transactions/route";
import { createSession } from "../lib/auth";

const TOKEN = await createSession(1);

const checkout = (items: unknown) => new Request("http://localhost/api/transactions", {
  method: "POST", headers: { "content-type": "application/json", cookie: `session=${TOKEN}` }, body: JSON.stringify({ items }),
});

test("checkout valid → 201 { transaction } dengan total", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: 2 }]));
  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.transaction.total).toBeGreaterThan(0);
  expect(body.transaction.items.length).toBe(1);
});
test("stok kurang → 409 { error }", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: 99999 }]));
  expect(res.status).toBe(409);
  expect(await res.json()).toHaveProperty("error");
});
test("items kosong → 400", async () => {
  const res = await POST!(checkout([]));
  expect(res.status).toBe(400);
});
test("qty tidak integer → 400", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: "abc" }]));
  expect(res.status).toBe(400);
});
test("GET ?date= mengembalikan transaksi berhari itu", async () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const res = await GET!(new Request(`http://localhost/api/transactions?date=${today}`));
  expect(res.status).toBe(200);
  expect((await res.json()).transactions.length).toBeGreaterThan(0);
});
test("REVIEW: checkout tanpa session → 401 { error }", async () => {
  const res = await POST!(new Request("http://localhost/api/transactions", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: [{ productId: 1, qty: 1 }] }),
  }));
  expect(res.status).toBe(401);
  expect(await res.json()).toHaveProperty("error");
});
test("REVIEW: body null → 400 { error }", async () => {
  const res = await POST!(new Request("http://localhost/api/transactions", {
    method: "POST", headers: { "content-type": "application/json", cookie: `session=${TOKEN}` }, body: "null",
  }));
  expect(res.status).toBe(400);
  expect(await res.json()).toHaveProperty("error");
});
