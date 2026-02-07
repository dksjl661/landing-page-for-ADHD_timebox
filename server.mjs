import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DOWNLOAD_FILE = "ADHD-Timebox-v.3.0-arm64.dmg";
const DEFAULT_DOWNLOAD_PATH = path.join(
  ROOT_DIR,
  "downloads",
  DEFAULT_DOWNLOAD_FILE
);
const DEFAULT_PUBLIC_DOWNLOAD_URL =
  "https://github.com/dksjl661/landing-page-for-ADHD_timebox/releases/download/v0.3.0/ADHD-Timebox-v.3.0-arm64.dmg";

const STATIC_ROUTES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/styles.css": "styles.css",
  "/script.js": "script.js",
};

const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".json", ".txt", ".svg"]);
const IMMUTABLE_PREFIXES = ["/assets/"];
const staticCache = new Map();

function contentTypeFor(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".mjs") return "text/javascript; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

function resolveStaticPath(pathname) {
  if (STATIC_ROUTES[pathname]) {
    return path.join(ROOT_DIR, STATIC_ROUTES[pathname]);
  }

  if (pathname.startsWith("/assets/")) {
    const relativePath = pathname.replace(/^\/+/, "");
    const absolutePath = path.resolve(ROOT_DIR, relativePath);
    if (absolutePath.startsWith(`${ROOT_DIR}${path.sep}`)) {
      return absolutePath;
    }
  }

  return null;
}

function cacheControlFor(pathname, extension) {
  if (IMMUTABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "public, max-age=31536000, immutable";
  }
  if (TEXT_EXTENSIONS.has(extension) && extension !== ".html") {
    return "public, max-age=86400";
  }
  return "public, max-age=0, must-revalidate";
}

function shouldCompress(extension) {
  return TEXT_EXTENSIONS.has(extension);
}

function selectEncoding(acceptEncoding = "") {
  if (acceptEncoding.includes("br")) return "br";
  if (acceptEncoding.includes("gzip")) return "gzip";
  return "";
}

async function getStaticEntry(pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) return null;

  const extension = path.extname(filePath).toLowerCase();

  const cached = staticCache.get(filePath);
  if (cached) return cached;

  const [buffer, stat] = await Promise.all([fsp.readFile(filePath), fsp.stat(filePath)]);
  const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const compressible = shouldCompress(extension);
  const entry = {
    extension,
    contentType: contentTypeFor(filePath),
    data: buffer,
    br: compressible ? brotliCompressSync(buffer) : null,
    gzip: compressible ? gzipSync(buffer) : null,
    etag,
    lastModified: stat.mtime.toUTCString(),
    cacheControl: cacheControlFor(pathname, extension),
  };

  staticCache.set(filePath, entry);
  return entry;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code ?? "unknown"}`));
    });
  });
}

function inferArchiveName(sourcePath) {
  const appName = path.basename(sourcePath, ".app");
  const parent = path.basename(path.dirname(sourcePath));
  const versionMatch = parent.match(/(\d+\.\d+\.\d+-[A-Za-z0-9]+)/);
  if (!versionMatch) return `${appName}.zip`;
  return `${appName}-${versionMatch[1]}.zip`;
}

async function prepareDownload(downloadPath) {
  const sourcePath =
    downloadPath ??
    process.env.ADHD_TIMEBOX_DOWNLOAD_PATH ??
    DEFAULT_DOWNLOAD_PATH;

  let sourceStat;
  try {
    sourceStat = await fsp.stat(sourcePath);
  } catch {
    return {
      status: 404,
      message: `Download source not found: ${sourcePath}`,
    };
  }

  if (sourceStat.isFile()) {
    return {
      status: 200,
      sourcePath,
      fileName: path.basename(sourcePath),
      cleanup: async () => {},
    };
  }

  if (sourceStat.isDirectory() && sourcePath.endsWith(".app")) {
    const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "adhd-timebox-"));
    const archiveName = inferArchiveName(sourcePath);
    const archivePath = path.join(tempDir, archiveName);

    try {
      await run("ditto", [
        "-c",
        "-k",
        "--sequesterRsrc",
        "--keepParent",
        sourcePath,
        archivePath,
      ]);
    } catch {
      await fsp.rm(tempDir, { recursive: true, force: true });
      return {
        status: 500,
        message: "Failed to package app bundle for download.",
      };
    }

    return {
      status: 200,
      sourcePath: archivePath,
      fileName: archiveName,
      cleanup: async () => {
        await fsp.rm(tempDir, { recursive: true, force: true });
      },
    };
  }

  return {
    status: 400,
    message: "Download source must be a file or a macOS .app bundle.",
  };
}

function sendText(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

async function sendStatic(request, response, pathname) {
  let entry;
  try {
    entry = await getStaticEntry(pathname);
  } catch {
    sendText(response, 404, "Not found.");
    return;
  }

  if (!entry) {
    sendText(response, 404, "Not found.");
    return;
  }

  if (request.headers["if-none-match"] === entry.etag) {
    response.statusCode = 304;
    response.setHeader("cache-control", entry.cacheControl);
    response.setHeader("etag", entry.etag);
    response.setHeader("last-modified", entry.lastModified);
    response.end();
    return;
  }

  const encoding = selectEncoding(request.headers["accept-encoding"] ?? "");
  let payload = entry.data;

  if (encoding === "br" && entry.br) {
    payload = entry.br;
    response.setHeader("content-encoding", "br");
  } else if (encoding === "gzip" && entry.gzip) {
    payload = entry.gzip;
    response.setHeader("content-encoding", "gzip");
  }

  response.statusCode = 200;
  response.setHeader("content-type", entry.contentType);
  response.setHeader("cache-control", entry.cacheControl);
  response.setHeader("etag", entry.etag);
  response.setHeader("last-modified", entry.lastModified);
  response.setHeader("vary", "Accept-Encoding");

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(payload);
}

async function sendDownload(downloadPath, response) {
  const prepared = await prepareDownload(downloadPath);
  if (prepared.status !== 200) {
    sendText(response, prepared.status, prepared.message);
    return;
  }

  const { sourcePath, fileName, cleanup } = prepared;
  let didCleanup = false;
  const cleanupOnce = async () => {
    if (didCleanup) return;
    didCleanup = true;
    await cleanup();
  };

  response.statusCode = 200;
  response.setHeader("content-type", "application/octet-stream");
  response.setHeader("content-disposition", `attachment; filename="${fileName}"`);

  const stream = fs.createReadStream(sourcePath);
  stream.on("error", async () => {
    if (!response.headersSent) {
      sendText(response, 500, "Failed to read download file.");
    } else {
      response.destroy();
    }
    await cleanupOnce();
  });

  response.on("close", () => {
    void cleanupOnce();
  });

  stream.pipe(response);
}

export function createServer(options = {}) {
  const { downloadPath, publicDownloadUrl } = options;

  return http.createServer(async (request, response) => {
    const method = request.method ?? "GET";
    if (!["GET", "HEAD"].includes(method)) {
      sendText(response, 405, "Method not allowed.");
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    if (pathname === "/download") {
      const effectivePublicDownloadUrl =
        typeof publicDownloadUrl === "string"
          ? publicDownloadUrl
          : process.env.ADHD_TIMEBOX_PUBLIC_DOWNLOAD_URL ??
            DEFAULT_PUBLIC_DOWNLOAD_URL;

      if (effectivePublicDownloadUrl) {
        response.statusCode = 302;
        response.setHeader("location", effectivePublicDownloadUrl);
        response.setHeader("cache-control", "no-store");
        response.end();
        return;
      }
      await sendDownload(downloadPath, response);
      return;
    }

    await sendStatic(request, response, pathname);
  });
}

const currentFilePath = fileURLToPath(import.meta.url);
const launchedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (launchedFilePath === currentFilePath) {
  const port = Number.parseInt(process.env.PORT ?? "4173", 10);
  const server = createServer();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Landing page ready at http://localhost:${port}`);
  });
}
