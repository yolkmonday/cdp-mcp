import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerInteractTools(server: McpServer) {
  server.tool(
    "cdp_click",
    "Click an element on the page",
    { selector: z.string().describe("CSS selector of the element to click") },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: `(() => {
          const el = document.querySelector('${selector}');
          if (!el) return 'Element not found: ${selector}';
          el.click();
          return 'Clicked: ${selector}';
        })()`,
      });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );

  server.tool(
    "cdp_type",
    "Type text into an input field",
    {
      selector: z.string().describe("CSS selector of the input element"),
      text: z.string().describe("Text to type"),
      clear: z.boolean().optional().default(true).describe("Clear the field before typing"),
    },
    async ({ selector, text, clear }) => {
      const client = await getClient();
      const { Runtime } = client;
      const safeText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const expression = `(() => {
        const el = document.querySelector('${selector}');
        if (!el) return 'Element not found: ${selector}';
        el.focus();
        ${clear ? "el.value = '';" : ""}
        el.value = '${safeText}';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'Typed into: ${selector}';
      })()`;
      const result = await Runtime.evaluate({ expression });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );

  server.tool(
    "cdp_scroll",
    "Scroll the page or to a specific element",
    {
      direction: z.enum(["up", "down", "top", "bottom"]).describe("Scroll direction"),
      amount: z.number().optional().default(500).describe("Pixels to scroll (for up/down)"),
      selector: z.string().optional().describe("CSS selector to scroll to a specific element"),
    },
    async ({ direction, amount, selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      let expression: string;
      if (selector) {
        expression = `(() => {
          const el = document.querySelector('${selector}');
          if (!el) return 'Element not found';
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return 'Scrolled to: ${selector}';
        })()`;
      } else {
        const scrollMap: Record<string, string> = {
          up: `window.scrollBy(0, -${amount})`,
          down: `window.scrollBy(0, ${amount})`,
          top: `window.scrollTo(0, 0)`,
          bottom: `window.scrollTo(0, document.body.scrollHeight)`,
        };
        expression = `(() => { ${scrollMap[direction]}; return 'Scrolled ${direction}'; })()`;
      }
      const result = await Runtime.evaluate({ expression });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );

  server.tool(
    "cdp_wait",
    "Wait for an element to appear on the page",
    {
      selector: z.string().describe("CSS selector to wait for"),
      timeout: z.number().optional().default(10000).describe("Timeout in milliseconds"),
    },
    async ({ selector, timeout }) => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: `new Promise((resolve) => {
          if (document.querySelector('${selector}')) {
            resolve('Element found: ${selector}');
            return;
          }
          const observer = new MutationObserver(() => {
            if (document.querySelector('${selector}')) {
              observer.disconnect();
              resolve('Element found: ${selector}');
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            resolve('Timeout waiting for: ${selector}');
          }, ${timeout});
        })`,
        awaitPromise: true,
      });
      return { content: [{ type: "text", text: result.result.value as string }] };
    }
  );
}
