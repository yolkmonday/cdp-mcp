import CDP from "chrome-remote-interface";

let client: CDP.Client | null = null;

export async function getClient(): Promise<CDP.Client> {
  if (client) return client;
  try {
    client = await CDP({ host: "localhost", port: 9222 });
    client.on("disconnect", () => {
      client = null;
    });
    return client;
  } catch (err) {
    throw new Error(
      "Cannot connect to Chrome. Start Chrome with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222"
    );
  }
}

export async function closeClient() {
  if (client) {
    await client.close();
    client = null;
  }
}
