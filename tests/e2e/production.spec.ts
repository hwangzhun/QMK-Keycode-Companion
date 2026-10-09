import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
let server: Server;
let origin: string;
const prefix = "/QMK-Keycode-Companion/";
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://127.0.0.1");
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    const relative =
      decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html";
    const root = path.join(process.cwd(), "dist"),
      filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const bytes = await fs.readFile(filename);
      res.setHeader(
        "Content-Type",
        types[path.extname(filename)] ?? "application/octet-stream",
      );
      res.writeHead(200).end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("No server address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
});
test("production build works under a GitHub Pages repository subpath with local assets", async ({
  page,
}) => {
  const errors: string[] = [],
    external: string[] = [],
    missing: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(origin)) external.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) missing.push(response.url());
  });
  await page.goto(origin + prefix);
  await expect(page.getByRole("heading", { name: "键码库" })).toBeVisible();
  await page
    .getByRole("textbox", { name: "搜索键码或快捷键…", exact: true })
    .fill("Ctrl+V");
  await page
    .locator(".result-actions")
    .getByRole("button", { name: /载入生成器/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "生成代码", exact: true }),
  ).toHaveValue("LCTL(KC_V)");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(
    page.getByRole("heading", { name: "Keycode library" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(missing).toEqual([]);
});
