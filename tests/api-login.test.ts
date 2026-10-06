process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`;
import { POST } from "../app/api/auth/login/route";

const req = (body: unknown) => new Request("http://localhost/api/auth/login", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

test("login benar → 200 + set-cookie", async () => {
  const res = await POST!(req({ username: "admin", password: "admin123" }));
  expect(res.status).toBe(200);
  expect(res.headers.get("set-cookie")).toStartWith("session=");
});
test("login salah → 401 { error }", async () => {
  const res = await POST!(req({ username: "admin", password: "salah" }));
  expect(res.status).toBe(401);
  expect(await res.json()).toHaveProperty("error");
});
test("body kosong → 400", async () => {
  const res = await POST!(req({}));
  expect(res.status).toBe(400);
});
