import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// `dotenv/config` alone only reads .env — .env.local (where `vercel env pull`
// writes the real Postgres connection string) needs loading explicitly, with
// override so it wins over any stale value left in .env, matching how Next.js
// itself prioritizes .env.local.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
