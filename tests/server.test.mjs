import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createServer } from "../server.mjs";

const cleanupDirs = [];

afterEach(async () => {
  await Promise.all(
    cleanupDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    })
  );
});

async function withServer(options, run) {
  const server = await createServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("serves homepage with get app CTA", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /id="get-app-btn"/);
    assert.match(html, /Get the app/);
  });
});

test("landing html uses relative static paths", async () => {
  const htmlPath = new URL("../index.html", import.meta.url);
  const html = await fs.readFile(htmlPath, "utf8");

  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/script\.js"/);
  assert.match(html, /id="get-app-btn" class="cta-primary" href="\.\/download"/);
});

test("script contains file protocol download fallback", async () => {
  const scriptPath = new URL("../script.js", import.meta.url);
  const script = await fs.readFile(scriptPath, "utf8");

  assert.match(script, /window\.location\.protocol === "file:"/);
  assert.match(
    script,
    /\.\/downloads\/ADHD-Timebox-0\.3\.0-arm64\.dmg/
  );
  assert.doesNotMatch(script, /Preparing download/);
  assert.doesNotMatch(script, /setTimeout\(/);
});

test("redirects to public download URL when configured", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adhd-timebox-public-"));
  cleanupDirs.push(tempDir);
  const fallbackPath = path.join(tempDir, "fallback.dmg");
  await fs.writeFile(fallbackPath, "fallback", "utf8");

  await withServer(
    {
      downloadPath: fallbackPath,
      publicDownloadUrl:
        "https://example.com/releases/ADHD-Timebox-0.3.0-arm64.dmg",
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/download`, { redirect: "manual" });

      assert.equal(response.status, 302);
      assert.equal(
        response.headers.get("location"),
        "https://example.com/releases/ADHD-Timebox-0.3.0-arm64.dmg"
      );
    }
  );
});

test("downloads binary when source file exists", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adhd-timebox-"));
  cleanupDirs.push(tempDir);
  const sourcePath = path.join(tempDir, "ADHD-Timebox-0.1.0-arm64.dmg");
  const payload = "download-content";
  await fs.writeFile(sourcePath, payload, "utf8");

  await withServer({ downloadPath: sourcePath }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/download`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(body, payload);
    assert.match(
      response.headers.get("content-disposition") ?? "",
      /attachment/
    );
  });
});

test("returns 404 when download source is missing", async () => {
  await withServer(
    { downloadPath: "/tmp/does-not-exist/ADHD-Timebox.dmg" },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/download`);
      const body = await response.text();

      assert.equal(response.status, 404);
      assert.match(body, /Download source not found/);
    }
  );
});

test("packages .app bundle and downloads zip", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adhd-timebox-app-"));
  cleanupDirs.push(tempDir);
  const appDir = path.join(tempDir, "ADHD-Timebox.app");
  await fs.mkdir(path.join(appDir, "Contents"), { recursive: true });
  await fs.writeFile(
    path.join(appDir, "Contents", "Info.plist"),
    "<plist></plist>",
    "utf8"
  );

  await withServer({ downloadPath: appDir }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/download`);
    const bytes = new Uint8Array(await response.arrayBuffer());

    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-disposition") ?? "",
      /\.zip"/
    );
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
  });
});
