import CDP from "chrome-remote-interface";
import { spawn } from "child_process";

const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CDP_PORT = 9222;

let client: CDP.Client | null = null;
let chromeProcess: ReturnType<typeof spawn> | null = null;

async function launchChrome(): Promise<void> {
  console.error("Launching Chrome with remote debugging...");
  chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      "--no-first-run",
      "--no-default-browser-check",
    ],
    { stdio: "ignore", detached: true }
  );
  chromeProcess.unref();

  // Wait for CDP to become available
  for (let i = 0; i < 30; i++) {
    try {
      await CDP.Version({ host: "localhost", port: CDP_PORT });
      console.error("Chrome is ready.");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Chrome launched but CDP not available after 15s");
}

async function ensureChrome(): Promise<void> {
  try {
    await CDP.Version({ host: "localhost", port: CDP_PORT });
  } catch {
    await launchChrome();
  }
}

export async function getClient(): Promise<CDP.Client> {
  if (client) return client;
  await ensureChrome();
  client = await CDP({ host: "localhost", port: CDP_PORT });
  client.on("disconnect", () => {
    client = null;
  });
  return client;
}

export async function closeClient() {
  if (client) {
    await client.close();
    client = null;
  }
}
