import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const prismaCli = require.resolve("prisma/build/index.js");
const nextCli = require.resolve("next/dist/bin/next");

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });

  if (result.error) {
    console.error("Unable to run build command:", result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  run([prismaCli, "migrate", "deploy", "--config", "prisma7.config.ts"]);
}

run([prismaCli, "generate"]);
run([nextCli, "build"]);
