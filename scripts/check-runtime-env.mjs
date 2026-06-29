const required = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "TOTP_ENCRYPTION_KEY",
  "CRON_SECRET",
];

const placeholders = [
  "replace-with",
  "change-me",
  "changeme",
  "example",
  "placeholder",
];

const failures = [];

for (const key of required) {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    failures.push(`${key} is required`);
    continue;
  }

  const normalized = value.toLowerCase();
  if (placeholders.some((token) => normalized.includes(token))) {
    failures.push(`${key} still contains a placeholder value`);
  }
}

if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  failures.push("SESSION_SECRET must be at least 32 characters");
}

if (
  process.env.TOTP_ENCRYPTION_KEY &&
  process.env.TOTP_ENCRYPTION_KEY.length < 32
) {
  failures.push("TOTP_ENCRYPTION_KEY must be at least 32 characters");
}

if (process.env.CRON_SECRET && process.env.CRON_SECRET.length < 24) {
  failures.push("CRON_SECRET must be at least 24 characters");
}

if (process.env.DATABASE_URL) {
  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    if (!databaseUrl.username || !databaseUrl.password || !databaseUrl.hostname) {
      failures.push("DATABASE_URL must include username, password, and host");
    }
  } catch {
    failures.push("DATABASE_URL is not a valid URL");
  }
}

if (failures.length > 0) {
  console.error("[env] Runtime environment validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[env] Runtime environment validation passed");
