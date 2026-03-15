import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerNavigateTools } from "./tools/navigate.js";
import { registerContentTools } from "./tools/content.js";
import { registerInteractTools } from "./tools/interact.js";
import { registerScreenshotTools } from "./tools/screenshot.js";
import { registerTabTools } from "./tools/tabs.js";
import { registerCookieTools } from "./tools/cookies.js";
import { registerEvaluateTools } from "./tools/evaluate.js";
import { registerDownloadTools } from "./tools/download.js";

const server = new McpServer({
  name: "cdp-agent",
  version: "1.0.0",
});

// Register all tools
registerNavigateTools(server);
registerContentTools(server);
registerInteractTools(server);
registerScreenshotTools(server);
registerTabTools(server);
registerCookieTools(server);
registerEvaluateTools(server);
registerDownloadTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CDP Agent MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
