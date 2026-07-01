import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/check-runtime-env.mjs"]);
run("npx", ["prisma", "migrate", "deploy"]);
run("npm", ["run", "db:seed"]);
run("npm", ["run", "start"]);
