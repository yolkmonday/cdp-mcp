import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerNavigateTools(server: McpServer) {
  server.tool(
    "cdp_navigate",
    "Navigate to a URL in the browser",
    {
      url: z.string().describe("The URL to navigate to"),
      waitForLoad: z.boolean().optional().default(true).describe("Wait for page load event"),
    },
    async ({ url, waitForLoad }) => {
      const client = await getClient();
      const { Page } = client;
      await Page.enable();
      await Page.navigate({ url });
      if (waitForLoad) {
        await Page.loadEventFired();
      }
      return { content: [{ type: "text", text: `Navigated to ${url}` }] };
    }
  );

  server.tool(
    "cdp_get_url",
    "Get the current page URL and title",
    {},
    async () => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: "JSON.stringify({ url: window.location.href, title: document.title })",
      });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );
}
