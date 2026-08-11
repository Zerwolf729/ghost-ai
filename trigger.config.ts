import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_hxyffxydtpkrtqmiioyp",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  // Secrets (OPENROUTER_AI_API_KEY, DATABASE_URL, LIVEBLOCKS_SECRET_KEY)
  // must be set via the Trigger.dev dashboard or CLI — not in this file.
  deploy: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      LIVEBLOCKS_SECRET_KEY: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
      LIVEBLOCKS_PUBLIC_KEY: process.env.LIVEBLOCKS_PUBLIC_KEY ?? "",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
    },
  },
});
