# CDP Agent MCP Server - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MCP server that controls Chrome via CDP for web scraping, navigation, and browser automation.

**Architecture:** TypeScript + Bun MCP server using `chrome-remote-interface` for CDP communication and `@modelcontextprotocol/sdk` for the MCP protocol. Server connects to Chrome running with `--remote-debugging-port=9222` and exposes browser control as MCP tools.

**Tech Stack:** Bun, TypeScript, `@modelcontextprotocol/server`, `zod/v4`, `chrome-remote-interface`

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts` (entry point stub)

**Step 1: Initialize project**

```bash
cd /Users/yolk/cdp-agent
bun init -y
```

**Step 2: Install dependencies**

```bash
bun add @anthropic-ai/sdk @modelcontextprotocol/server zod chrome-remote-interface
bun add -d @types/chrome-remote-interface
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

**Step 4: Create entry point stub `src/index.ts`**

```typescript
import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";

const server = new McpServer({
  name: "cdp-agent",
  version: "1.0.0",
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CDP Agent MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 5: Test it runs**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | bun run src/index.ts
```

Expected: JSON response with server capabilities

**Step 6: Commit**

```bash
git init && git add -A && git commit -m "feat: project setup with MCP server stub"
```

---

### Task 2: CDP Connection Manager

**Files:**
- Create: `src/cdp.ts`

**Step 1: Create CDP connection module**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/cdp.ts && git commit -m "feat: CDP connection manager"
```

---

### Task 3: Navigation Tools

**Files:**
- Modify: `src/index.ts`
- Create: `src/tools/navigate.ts`

**Step 1: Create navigate tool**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerNavigateTools(server: McpServer) {
  server.registerTool(
    "cdp_navigate",
    {
      description: "Navigate to a URL in the browser",
      inputSchema: z.object({
        url: z.string().describe("The URL to navigate to"),
        waitForLoad: z
          .boolean()
          .optional()
          .default(true)
          .describe("Wait for page load event"),
      }),
    },
    async ({ url, waitForLoad }) => {
      const client = await getClient();
      const { Page } = client;
      await Page.enable();
      await Page.navigate({ url });
      if (waitForLoad) {
        await Page.loadEventFired();
      }
      return {
        content: [{ type: "text", text: `Navigated to ${url}` }],
      };
    }
  );

  server.registerTool(
    "cdp_get_url",
    {
      description: "Get the current page URL and title",
      inputSchema: z.object({}),
    },
    async () => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: "JSON.stringify({ url: window.location.href, title: document.title })",
      });
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );
}
```

**Step 2: Wire into index.ts — import and call registerNavigateTools(server)**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: navigation tools (cdp_navigate, cdp_get_url)"
```

---

### Task 4: Content Extraction Tools

**Files:**
- Create: `src/tools/content.ts`

**Step 1: Create content extraction tools**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerContentTools(server: McpServer) {
  server.registerTool(
    "cdp_get_content",
    {
      description:
        "Extract text content from the page or a specific element. Returns cleaned text.",
      inputSchema: z.object({
        selector: z
          .string()
          .optional()
          .describe("CSS selector to extract from. If omitted, extracts full page text."),
      }),
    },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = selector
        ? `document.querySelector('${selector}')?.innerText || 'Element not found'`
        : `document.body.innerText`;
      const result = await Runtime.evaluate({ expression });
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );

  server.registerTool(
    "cdp_get_html",
    {
      description: "Get the HTML content of the page or a specific element",
      inputSchema: z.object({
        selector: z
          .string()
          .optional()
          .describe("CSS selector. If omitted, returns full page HTML."),
      }),
    },
    async ({ selector }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = selector
        ? `document.querySelector('${selector}')?.outerHTML || 'Element not found'`
        : `document.documentElement.outerHTML`;
      const result = await Runtime.evaluate({ expression });
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );

  server.registerTool(
    "cdp_get_table",
    {
      description:
        "Extract table data as JSON array. Useful for financial data tables.",
      inputSchema: z.object({
        selector: z
          .string()
          .describe("CSS selector for the table element"),
      }),
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
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );
}
```

**Step 2: Wire into index.ts**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: content extraction tools (cdp_get_content, cdp_get_html, cdp_get_table)"
```

---

### Task 5: Interaction Tools

**Files:**
- Create: `src/tools/interact.ts`

**Step 1: Create interaction tools (click, type, scroll)**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerInteractTools(server: McpServer) {
  server.registerTool(
    "cdp_click",
    {
      description: "Click an element on the page",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector of the element to click"),
      }),
    },
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
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );

  server.registerTool(
    "cdp_type",
    {
      description: "Type text into an input field",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector of the input element"),
        text: z.string().describe("Text to type"),
        clear: z
          .boolean()
          .optional()
          .default(true)
          .describe("Clear the field before typing"),
      }),
    },
    async ({ selector, text, clear }) => {
      const client = await getClient();
      const { Runtime } = client;
      const expression = `(() => {
        const el = document.querySelector('${selector}');
        if (!el) return 'Element not found: ${selector}';
        el.focus();
        ${clear ? "el.value = '';" : ""}
        el.value = '${text.replace(/'/g, "\\'")}';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'Typed into: ${selector}';
      })()`;
      const result = await Runtime.evaluate({ expression });
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );

  server.registerTool(
    "cdp_scroll",
    {
      description: "Scroll the page or an element",
      inputSchema: z.object({
        direction: z
          .enum(["up", "down", "top", "bottom"])
          .describe("Scroll direction"),
        amount: z
          .number()
          .optional()
          .default(500)
          .describe("Pixels to scroll (for up/down)"),
        selector: z
          .string()
          .optional()
          .describe("CSS selector to scroll to a specific element"),
      }),
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
        expression = `${scrollMap[direction]}; 'Scrolled ${direction}'`;
      }
      const result = await Runtime.evaluate({ expression });
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );

  server.registerTool(
    "cdp_wait",
    {
      description: "Wait for an element to appear on the page",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector to wait for"),
        timeout: z
          .number()
          .optional()
          .default(10000)
          .describe("Timeout in milliseconds"),
      }),
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
      return {
        content: [{ type: "text", text: result.result.value as string }],
      };
    }
  );
}
```

**Step 2: Wire into index.ts**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: interaction tools (cdp_click, cdp_type, cdp_scroll, cdp_wait)"
```

---

### Task 6: Screenshot Tool

**Files:**
- Create: `src/tools/screenshot.ts`

**Step 1: Create screenshot tool**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerScreenshotTools(server: McpServer) {
  server.registerTool(
    "cdp_screenshot",
    {
      description: "Take a screenshot of the current page",
      inputSchema: z.object({
        fullPage: z
          .boolean()
          .optional()
          .default(false)
          .describe("Capture full page or just viewport"),
        selector: z
          .string()
          .optional()
          .describe("CSS selector to capture specific element"),
      }),
    },
    async ({ fullPage, selector }) => {
      const client = await getClient();
      const { Page, Runtime, DOM } = client;

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
            type: "image",
            data: screenshot.data,
            mimeType: "image/png",
          },
        ],
      };
    }
  );
}
```

**Step 2: Wire into index.ts**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: screenshot tool (cdp_screenshot)"
```

---

### Task 7: Tab Management Tools

**Files:**
- Create: `src/tools/tabs.ts`

**Step 1: Create tab management tools**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import CDP from "chrome-remote-interface";
import { getClient } from "../cdp.js";

export function registerTabTools(server: McpServer) {
  server.registerTool(
    "cdp_list_tabs",
    {
      description: "List all open browser tabs",
      inputSchema: z.object({}),
    },
    async () => {
      const targets = await CDP.List({ host: "localhost", port: 9222 });
      const tabs = targets
        .filter((t: any) => t.type === "page")
        .map((t: any) => ({ id: t.id, title: t.title, url: t.url }));
      return {
        content: [{ type: "text", text: JSON.stringify(tabs, null, 2) }],
      };
    }
  );

  server.registerTool(
    "cdp_new_tab",
    {
      description: "Open a new browser tab",
      inputSchema: z.object({
        url: z
          .string()
          .optional()
          .default("about:blank")
          .describe("URL to open in the new tab"),
      }),
    },
    async ({ url }) => {
      const target = await CDP.New({ host: "localhost", port: 9222, url });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id: target.id, title: target.title, url: target.url },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "cdp_close_tab",
    {
      description: "Close a browser tab by ID",
      inputSchema: z.object({
        tabId: z.string().describe("The tab ID to close"),
      }),
    },
    async ({ tabId }) => {
      await CDP.Close({ host: "localhost", port: 9222, id: tabId });
      return {
        content: [{ type: "text", text: `Closed tab: ${tabId}` }],
      };
    }
  );

  server.registerTool(
    "cdp_switch_tab",
    {
      description: "Switch to a browser tab by ID",
      inputSchema: z.object({
        tabId: z.string().describe("The tab ID to activate"),
      }),
    },
    async ({ tabId }) => {
      await CDP.Activate({ host: "localhost", port: 9222, id: tabId });
      return {
        content: [{ type: "text", text: `Switched to tab: ${tabId}` }],
      };
    }
  );
}
```

**Step 2: Wire into index.ts**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: tab management tools (list, new, close, switch)"
```

---

### Task 8: Cookie & Evaluate Tools

**Files:**
- Create: `src/tools/cookies.ts`
- Create: `src/tools/evaluate.ts`

**Step 1: Create cookies tool**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerCookieTools(server: McpServer) {
  server.registerTool(
    "cdp_get_cookies",
    {
      description: "Get all cookies for the current page",
      inputSchema: z.object({}),
    },
    async () => {
      const client = await getClient();
      const { Network } = client;
      const { cookies } = await Network.getCookies();
      return {
        content: [{ type: "text", text: JSON.stringify(cookies, null, 2) }],
      };
    }
  );

  server.registerTool(
    "cdp_set_cookie",
    {
      description: "Set a browser cookie",
      inputSchema: z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string().optional(),
        path: z.string().optional().default("/"),
      }),
    },
    async ({ name, value, domain, path }) => {
      const client = await getClient();
      const { Network } = client;
      await Network.setCookie({ name, value, domain, path });
      return {
        content: [{ type: "text", text: `Cookie set: ${name}` }],
      };
    }
  );

  server.registerTool(
    "cdp_clear_cookies",
    {
      description: "Clear all browser cookies",
      inputSchema: z.object({}),
    },
    async () => {
      const client = await getClient();
      const { Network } = client;
      await Network.clearBrowserCookies();
      return {
        content: [{ type: "text", text: "All cookies cleared" }],
      };
    }
  );
}
```

**Step 2: Create evaluate tool**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";

export function registerEvaluateTools(server: McpServer) {
  server.registerTool(
    "cdp_evaluate",
    {
      description:
        "Execute arbitrary JavaScript in the browser. Returns the result.",
      inputSchema: z.object({
        expression: z.string().describe("JavaScript expression to evaluate"),
        awaitPromise: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether to await the result if it is a Promise"),
      }),
    },
    async ({ expression, awaitPromise }) => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({ expression, awaitPromise });
      if (result.exceptionDetails) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${result.exceptionDetails.text || JSON.stringify(result.exceptionDetails)}`,
            },
          ],
          isError: true,
        };
      }
      const value = result.result.value ?? result.result.description ?? "undefined";
      return {
        content: [
          { type: "text", text: typeof value === "string" ? value : JSON.stringify(value) },
        ],
      };
    }
  );
}
```

**Step 3: Wire both into index.ts**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: cookie and evaluate tools"
```

---

### Task 9: Download Tool

**Files:**
- Create: `src/tools/download.ts`

**Step 1: Create download tool**

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getClient } from "../cdp.js";
import { homedir } from "os";
import { join } from "path";

export function registerDownloadTools(server: McpServer) {
  server.registerTool(
    "cdp_download",
    {
      description:
        "Enable file downloads and trigger a download by clicking a link or navigating to a URL",
      inputSchema: z.object({
        selector: z
          .string()
          .optional()
          .describe("CSS selector of download link to click"),
        url: z
          .string()
          .optional()
          .describe("Direct URL to download"),
        downloadPath: z
          .string()
          .optional()
          .default(join(homedir(), "Downloads"))
          .describe("Directory to save downloads"),
      }),
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
        return {
          content: [
            { type: "text", text: `Download initiated from URL: ${url} → ${downloadPath}` },
          ],
        };
      }

      if (selector) {
        await Runtime.evaluate({
          expression: `document.querySelector('${selector}')?.click()`,
        });
        return {
          content: [
            { type: "text", text: `Download triggered via click: ${selector} → ${downloadPath}` },
          ],
        };
      }

      return {
        content: [{ type: "text", text: "Provide either selector or url" }],
        isError: true,
      };
    }
  );
}
```

**Step 2: Wire into index.ts**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: download tool"
```

---

### Task 10: Final Wiring & Config

**Files:**
- Modify: `src/index.ts` (final version with all tools registered)
- Create: `start-chrome.sh` (helper script)
- Create: `README.md`

**Step 1: Finalize src/index.ts with all tool registrations**

**Step 2: Create `start-chrome.sh`**

```bash
#!/bin/bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  "$@"
```

**Step 3: Add MCP config to `~/.claude/settings.json`**

Add to `mcpServers`:
```json
"cdp-agent": {
  "command": "bun",
  "args": ["run", "/Users/yolk/cdp-agent/src/index.ts"]
}
```

**Step 4: End-to-end test**

1. Run `bash start-chrome.sh`
2. Restart Claude Code
3. Test: ask Claude to navigate to a page and extract content

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: finalize wiring, add helper scripts and config"
```
