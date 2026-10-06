process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`;
import { GET, POST } from "../app/api/products/route";
import { PUT, DELETE } from "../app/api/products/[id]/route";
import { createSession } from "../lib/auth";

const TOKEN = await createSession(1);

const json = (body: unknown) => new Request("http://localhost/api/products", {
  method: "POST", headers: { "content-type": "application/json", cookie: `session=${TOKEN}` }, body: JSON.stringify(body),
});

const jsonNoAuth = (body: unknown) => new Request("http://localhost/api/products", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

test("GET → 200 dengan daftar produk seed", async () => {
  const res = await GET!(new Request("http://localhost/api/products"));
  expect(res.status).toBe(200);
  expect((await res.json()).products.length).toBe(10);
});
test("POST valid → 201 + product", async () => {
  const res = await POST!(json({ name: "Baru", category: "makanan", price: 500, stock: 2, emoji: "📦" }));
  expect(res.status).toBe(201);
  expect((await res.json()).product.name).toBe("Baru");
});
test("POST harga negatif → 400 { error }", async () => {
  const res = await POST!(json({ name: "X", category: "makanan", price: -5, stock: 1 }));
  expect(res.status).toBe(400);
  expect(await res.json()).toHaveProperty("error");
});
test("PUT id tidak ada → 404", async () => {
  const res = await PUT!(json({ name: "X", category: "makanan", price: 1, stock: 1 }), { params: { id: "9999" } });
  expect(res.status).toBe(404);
  expect(await res.json()).toHaveProperty("error");
});
test("DELETE id tidak ada → 404", async () => {
  const res = await DELETE!(new Request("http://localhost/api/products/9999", { headers: { cookie: `session=${TOKEN}` } }), { params: { id: "9999" } });
  expect(res.status).toBe(404);
});
test("DELETE id ada → 204", async () => {
  const created = await POST!(json({ name: "Hapus", category: "lainnya", price: 1, stock: 1 }));
  const { product } = await created.json();
  const res = await DELETE!(new Request(`http://localhost/api/products/${product.id}`, { headers: { cookie: `session=${TOKEN}` } }), { params: { id: String(product.id) } });
  expect(res.status).toBe(204);
});
test("REVIEW: POST tanpa session → 401 { error }", async () => {
  const res = await POST!(jsonNoAuth({ name: "X", category: "makanan", price: 1, stock: 1 }));
  expect(res.status).toBe(401);
  expect(await res.json()).toHaveProperty("error");
});
test("REVIEW: PUT tanpa session → 401", async () => {
  const res = await PUT!(new Request("http://localhost/api/products/1", {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "X", category: "makanan", price: 1, stock: 1 }),
  }), { params: { id: "1" } });
  expect(res.status).toBe(401);
});
test("REVIEW: DELETE tanpa session → 401", async () => {
  const res = await DELETE!(new Request("http://localhost/api/products/1", { method: "DELETE" }), { params: { id: "1" } });
  expect(res.status).toBe(401);
});
test("REVIEW: POST body null → 400 { error }", async () => {
  const res = await POST!(new Request("http://localhost/api/products", {
    method: "POST", headers: { "content-type": "application/json", cookie: `session=${TOKEN}` }, body: "null",
  }));
  expect(res.status).toBe(400);
  expect(await res.json()).toHaveProperty("error");
});
test("REVIEW: POST emoji non-string → 400 { error }", async () => {
  const res = await POST!(json({ name: "X", category: "makanan", price: 1, stock: 1, emoji: 123 }));
  expect(res.status).toBe(400);
  expect(await res.json()).toHaveProperty("error");
});
