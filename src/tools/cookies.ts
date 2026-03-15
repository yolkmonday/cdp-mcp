import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerCookieTools(server: McpServer) {
  server.tool(
    "cdp_get_cookies",
    "Get all cookies for the current page",
    {},
    async () => {
      const client = await getClient();
      const { Network } = client;
      const { cookies } = await Network.getCookies();
      return { content: [{ type: "text", text: JSON.stringify(cookies, null, 2) }] };
    }
  );

  server.tool(
    "cdp_set_cookie",
    "Set a browser cookie",
    {
      name: z.string(),
      value: z.string(),
      domain: z.string().optional(),
      path: z.string().optional().default("/"),
    },
    async ({ name, value, domain, path }) => {
      const client = await getClient();
      const { Network } = client;
      await Network.setCookie({ name, value, domain, path });
      return { content: [{ type: "text", text: `Cookie set: ${name}` }] };
    }
  );

  server.tool(
    "cdp_clear_cookies",
    "Clear all browser cookies",
    {},
    async () => {
      const client = await getClient();
      const { Network } = client;
      await Network.clearBrowserCookies();
      return { content: [{ type: "text", text: "All cookies cleared" }] };
    }
  );
}
