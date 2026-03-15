import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";
import { homedir } from "os";
import { join } from "path";

export function registerDownloadTools(server: McpServer) {
  server.tool(
    "cdp_download",
    "Enable file downloads and trigger a download by clicking a link or navigating to a URL",
    {
      selector: z.string().optional().describe("CSS selector of download link to click"),
      url: z.string().optional().describe("Direct URL to download"),
      downloadPath: z.string().optional().default(join(homedir(), "Downloads")).describe("Directory to save downloads"),
    },
    async ({ selector, url, downloadPath }) => {
      const client = await getClient();
      const { Browser, Page, Runtime } = client;

      await Browser.setDownloadBehavior({
        behavior: "allow",
        downloadPath,
      });

      if (url) {
        await Page.navigate({ url });
        return { content: [{ type: "text", text: `Download initiated from URL: ${url} → ${downloadPath}` }] };
      }

      if (selector) {
        await Runtime.evaluate({
          expression: `document.querySelector('${selector}')?.click()`,
        });
        return { content: [{ type: "text", text: `Download triggered via click: ${selector} → ${downloadPath}` }] };
      }

      return { content: [{ type: "text", text: "Provide either selector or url" }], isError: true };
    }
  );
}
