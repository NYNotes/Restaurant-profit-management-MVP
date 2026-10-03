import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const exec = promisify(execFile);
const require = createRequire(import.meta.url);
const configPath = fileURLToPath(new URL("../../prisma.config.ts", import.meta.url));
const baseUrl = "postgresql://test:test@localhost:5432/base";
const localUrl = "postgresql://test:test@localhost:5432/local";
const inheritedUrl = "postgresql://test:test@localhost:5432/inherited";

// Load the actual config, dotenv and Prisma in a fresh process/temp directory.
// No real .env files, shell DATABASE_URL values or DB connections are used.
async function loadConfig(files: Record<string, string>, databaseUrl?: string) {
  const cwd = await mkdtemp(join(tmpdir(), "prisma-config-test-"));
  try {
    await Promise.all(Object.entries(files).map(([name, url]) => writeFile(join(cwd, name), `DATABASE_URL=${url}\n`)));
    const env: NodeJS.ProcessEnv = { ...process.env, DOTENV_CONFIG_QUIET: "true" };
    delete env.DATABASE_URL;
    if (databaseUrl) env.DATABASE_URL = databaseUrl;
    await exec(process.execPath, [
      "--require", require.resolve("tsx/cjs"), "--eval",
      `const config = require(${JSON.stringify(configPath)}).default; require("node:fs").writeFileSync("result.json", JSON.stringify(config.datasource));`,
    ], { cwd, env }).catch(() => {
      throw new Error("Prisma config could not be loaded in the isolated process");
    });
    return JSON.parse(await readFile(join(cwd, "result.json"), "utf8"));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

describe("Prisma CLI environment loading", () => {
  it("loads .env.local without .env", async () => {
    expect(await loadConfig({ ".env.local": localUrl })).toEqual({ url: localUrl });
  });
  it("prefers .env.local over stale .env and inherited DATABASE_URL", async () => {
    expect(await loadConfig({ ".env": baseUrl, ".env.local": localUrl }, inheritedUrl)).toEqual({ url: localUrl });
  });
  it("falls back to .env when .env.local is absent", async () => {
    expect(await loadConfig({ ".env": baseUrl })).toEqual({ url: baseUrl });
  });
  it("preserves inherited DATABASE_URL when .env.local is absent", async () => {
    expect(await loadConfig({ ".env": baseUrl }, inheritedUrl)).toEqual({ url: inheritedUrl });
  });
});
