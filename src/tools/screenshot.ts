import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerScreenshotTools(server: McpServer) {
  server.tool(
    "cdp_screenshot",
    "Take a screenshot of the current page",
    {
      fullPage: z.boolean().optional().default(false).describe("Capture full page or just viewport"),
      selector: z.string().optional().describe("CSS selector to capture specific element"),
    },
    async ({ fullPage, selector }) => {
      const client = await getClient();
      const { Page, Runtime } = client;

      let clip: { x: number; y: number; width: number; height: number; scale: number } | undefined;

      if (selector) {
        const result = await Runtime.evaluate({
          expression: `JSON.stringify(document.querySelector('${selector}')?.getBoundingClientRect())`,
        });
        if (result.result.value && result.result.value !== "undefined") {
          const rect = JSON.parse(result.result.value as string);
          clip = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 };
        }
      }

      if (fullPage && !clip) {
        const metrics = await Page.getLayoutMetrics();
        clip = {
          x: 0,
          y: 0,
          width: metrics.cssContentSize.width,
          height: metrics.cssContentSize.height,
          scale: 1,
        };
      }

      const screenshot = await Page.captureScreenshot({
        format: "png",
        ...(clip ? { clip } : {}),
      });

      return {
        content: [
          {
            type: "image" as const,
            data: screenshot.data,
            mimeType: "image/png" as const,
          },
        ],
      };
    }
  );
}
