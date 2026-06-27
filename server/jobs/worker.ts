const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://web:3000";
const cronSecret = process.env.CRON_SECRET;
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 15 * 60 * 1000);

type Job = {
  name: string;
  run: () => Promise<void>;
};

async function callCronEndpoint(path: string) {
  if (!cronSecret) {
    throw new Error("CRON_SECRET is required for worker jobs");
  }

  const response = await fetch(`${appUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${path} failed with ${response.status}: ${body.slice(0, 500)}`,
    );
  }
}

const jobs: Job[] = [
  {
    name: "dormancy-check",
    run: () => callCronEndpoint("/api/dormancy/check"),
  },
];

async function runOnce() {
  for (const job of jobs) {
    const startedAt = Date.now();
    try {
      await job.run();
      console.log(
        `[worker] ${job.name} completed in ${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      console.error(`[worker] ${job.name} failed`, error);
    }
  }
}

async function main() {
  console.log(
    `[worker] starting ${jobs.length} job(s), interval=${intervalMs}ms`,
  );
  await runOnce();
  setInterval(runOnce, intervalMs);
}

void main();
