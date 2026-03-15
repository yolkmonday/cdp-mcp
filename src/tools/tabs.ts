import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import CDP from "chrome-remote-interface";

export function registerTabTools(server: McpServer) {
  server.tool(
    "cdp_list_tabs",
    "List all open browser tabs",
    {},
    async () => {
      const targets = await CDP.List({ host: "localhost", port: 9222 });
      const tabs = targets
        .filter((t: any) => t.type === "page")
        .map((t: any) => ({ id: t.id, title: t.title, url: t.url }));
      return { content: [{ type: "text", text: JSON.stringify(tabs, null, 2) }] };
    }
  );

  server.tool(
    "cdp_new_tab",
    "Open a new browser tab",
    {
      url: z.string().optional().default("about:blank").describe("URL to open in the new tab"),
    },
    async ({ url }) => {
      const target = await CDP.New({ host: "localhost", port: 9222, url });
      return {
        content: [{ type: "text", text: JSON.stringify({ id: target.id, title: target.title, url: target.url }, null, 2) }],
      };
    }
  );

  server.tool(
    "cdp_close_tab",
    "Close a browser tab by ID",
    { tabId: z.string().describe("The tab ID to close") },
    async ({ tabId }) => {
      await CDP.Close({ host: "localhost", port: 9222, id: tabId });
      return { content: [{ type: "text", text: `Closed tab: ${tabId}` }] };
    }
  );

  server.tool(
    "cdp_switch_tab",
    "Switch to a browser tab by ID",
    { tabId: z.string().describe("The tab ID to activate") },
    async ({ tabId }) => {
      await CDP.Activate({ host: "localhost", port: 9222, id: tabId });
      return { content: [{ type: "text", text: `Switched to tab: ${tabId}` }] };
    }
  );
}
