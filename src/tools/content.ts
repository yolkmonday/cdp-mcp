import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerContentTools(server: McpServer) {
  server.tool(
    "cdp_get_content",
    "Extract text content from the page or a specific CSS selector",
    {
      selector: z.string().optional().describe("CSS selector to extract from. If omitted, extracts full page text."),
    },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = selector
        ? `document.querySelector('${selector}')?.innerText || 'Element not found'`
        : `document.body.innerText`;
      const result = await Runtime.evaluate({ expression });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );

  server.tool(
    "cdp_get_html",
    "Get the HTML content of the page or a specific element",
    {
      selector: z.string().optional().describe("CSS selector. If omitted, returns full page HTML."),
    },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = selector
        ? `document.querySelector('${selector}')?.outerHTML || 'Element not found'`
        : `document.documentElement.outerHTML`;
      const result = await Runtime.evaluate({ expression });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );

  server.tool(
    "cdp_get_table",
    "Extract table data as JSON array. Useful for financial data tables.",
    {
      selector: z.string().describe("CSS selector for the table element"),
    },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = `(() => {
        const table = document.querySelector('${selector}');
        if (!table) return JSON.stringify({ error: 'Table not found' });
        const headers = [...table.querySelectorAll('th')].map(th => th.innerText.trim());
        const rows = [...table.querySelectorAll('tbody tr')].map(tr =>
          [...tr.querySelectorAll('td')].map(td => td.innerText.trim())
        );
        if (headers.length > 0) {
          return JSON.stringify(rows.map(row =>
            Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))
          ));
        }
        return JSON.stringify(rows);
      })()`;
      const result = await Runtime.evaluate({ expression });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );
}
