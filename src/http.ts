import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";

export interface McpHttpServerOptions {
  /** Factory function that creates a new McpServer instance per session */
  createServer: () => McpServer;
  /** Port to listen on (default: 3000) */
  port?: number;
  /** Path for MCP endpoint (default: "/mcp") */
  path?: string;
}

export interface McpHttpServer {
  server: Server;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createMcpHttpServer(options: McpHttpServerOptions): McpHttpServer {
  const { createServer: createMcpServer, port = 3000, path = "/mcp" } = options;
  const transports = new Map<string, StreamableHTTPServerTransport>();

  async function parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : undefined);
        } catch (e) {
          reject(e);
        }
      });
      req.on("error", reject);
    });
  }

  function sendJson(res: ServerResponse, status: number, data: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  async function handleMcpRequest(req: IncomingMessage, res: ServerResponse) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "POST") {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)!;
      } else {
        const mcpServer = createMcpServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, transport);
            console.log(`Session initialized: ${id}`);
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
            console.log(`Session closed: ${transport.sessionId}`);
          }
        };

        await mcpServer.connect(transport);
      }

      const body = await parseBody(req);
      await transport.handleRequest(req, res, body);
    } else if (req.method === "GET" || req.method === "DELETE") {
      if (!sessionId || !transports.has(sessionId)) {
        sendJson(res, 400, {
          jsonrpc: "2.0",
          error: { code: -32000, message: "Invalid or missing session ID" },
          id: null,
        });
        return;
      }

      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    } else {
      sendJson(res, 405, {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
      });
    }
  }

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    if (url.pathname === path) {
      try {
        await handleMcpRequest(req, res);
      } catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          sendJson(res, 500, {
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    } else {
      sendJson(res, 404, { error: "Not found" });
    }
  });

  return {
    server: httpServer,
    start: () =>
      new Promise((resolve) => {
        httpServer.listen(port, () => {
          console.log(`MCP server listening on http://localhost:${port}${path}`);
          resolve();
        });
      }),
    stop: async () => {
      console.log("Shutting down...");
      for (const transport of transports.values()) {
        await transport.close();
      }
      httpServer.close();
    },
  };
}
