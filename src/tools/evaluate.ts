import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { getClient } from "../cdp.js";

export function registerEvaluateTools(server: McpServer) {
  server.tool(
    "cdp_evaluate",
    "Execute arbitrary JavaScript in the browser and return the result",
    {
      expression: z.string().describe("JavaScript expression to evaluate"),
      awaitPromise: z.boolean().optional().default(false).describe("Whether to await the result if it is a Promise"),
    },
    async ({ expression, awaitPromise }) => {
      const client = await getClient();
      const { Runtime } = client;
      const result = await Runtime.evaluate({ expression, awaitPromise });
      if (result.exceptionDetails) {
        return {
          content: [{ type: "text", text: `Error: ${result.exceptionDetails.text || JSON.stringify(result.exceptionDetails)}` }],
          isError: true,
        };
      }
      const value = result.result.value ?? result.result.description ?? "undefined";
      return {
        content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }],
      };
    }
  );
}
