import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchPokemonList, fetchPokemonDetails } from "../utils/pokemon.js";

const BASE_URI = "mcp://pokemon-battle";

export function registerPokemonResources(server: McpServer) {
  // About resource
  server.registerResource(
    "about",
    `${BASE_URI}/about`,
    {
      description: "Information about the Pokemon Battle MCP server",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: `${BASE_URI}/about`,
          text: "Pokemon Battle MCP Server - Simulate epic Pokemon battles! Use the pokemon-battle tool to pit two Pokemon against each other and get detailed battle stats with AI-generated battle narratives.",
        },
      ],
    })
  );

  // Pokemon list resource
  server.registerResource(
    "pokemon-list",
    `${BASE_URI}/pokemon`,
    {
      description: "List of Pokemon from PokeAPI",
      mimeType: "application/json",
    },
    async () => {
      const pokemonList = await fetchPokemonList(50);
      return {
        contents: [
          {
            uri: `${BASE_URI}/pokemon`,
            text: JSON.stringify(pokemonList, null, 2),
          },
        ],
      };
    }
  );

  // Pokemon details by name
  server.registerResource(
    "pokemon-details",
    new ResourceTemplate(`${BASE_URI}/pokemon/{name}`, {
      list: undefined,
    }),
    {
      description: "Get detailed information about a Pokemon by name",
      mimeType: "application/json",
    },
    async (uri, { name }) => {
      const pokemonName = Array.isArray(name) ? name[0] : name;
      const pokemon = await fetchPokemonDetails(pokemonName);

      if (!pokemon) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                { error: `Pokemon "${pokemonName}" not found` },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(pokemon, null, 2),
          },
        ],
      };
    }
  );
}
