import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHttpServer } from "./http.js";

const createServer = () => {
  const server = new McpServer(
    {
      version: "1.0.0",
      name: "my-first-mcp",
    },
    {
      instructions: "This server solves math problems.",
      capabilities: { logging: {}, tools: {} },
    }
  );

  // Add your tools, resources, and prompts here

  server.registerTool(
    "add",
    {
      title: "Add",
      description: "Adds the numbers 1 and 2 together.",
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "The sum of 1 and 2 is 3",
          },
        ],
      };
    }
  );

  return server;
};

const mcp = createMcpHttpServer({
  createServer,
  port: 3001,
});

mcp.start();

process.on("SIGINT", () => mcp.stop().then(() => process.exit(0)));
