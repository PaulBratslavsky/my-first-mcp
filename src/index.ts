import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHttpServer } from "./http.js";
import { registerPokemonBattleTool } from "./tools/pokemon-battle.js";
import { registerPokemonResources } from "./resources/pokemon.js";

const createServer = () => {
  const server = new McpServer(
    {
      version: "1.0.0",
      name: "pokemon-battle-mcp",
    },
    {
      instructions:
        "This server provides Pokemon data and battle simulations. Use the pokemon-battle tool to simulate battles between Pokemon and create exciting battle narratives.",
      capabilities: { logging: {}, tools: {}, resources: {} },
    }
  );

  // Register tools
  registerPokemonBattleTool(server);

  // Register resources
  registerPokemonResources(server);

  return server;
};

const mcp = createMcpHttpServer({
  createServer,
  port: 3001,
});

mcp.start();

process.on("SIGINT", () => mcp.stop().then(() => process.exit(0)));
