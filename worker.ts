import { initTelegramCloudWorker } from "./server/telegram-worker";

console.log("==================================================");
console.log("ONE SHOT FMGE — CLOUD TELEGRAM WORKER PROCESS");
console.log("==================================================");

async function start() {
  const isConnected = await initTelegramCloudWorker();
  if (isConnected) {
    console.log("[Worker] Successfully connected to Telegram account.");
  } else {
    console.log("[Worker] Standing by. Awaiting user Telegram connection from web UI.");
  }
}

start();

const shutdown = (signal: string) => {
  console.log(`[Worker] Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[Worker] Unhandled Promise Rejection:", reason);
});
