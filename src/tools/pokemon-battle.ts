import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import {
  fetchPokemon,
  calculateBattleScore,
  Pokemon,
} from "../utils/pokemon.js";

export function registerPokemonBattleTool(server: McpServer) {
  server.registerTool(
    "pokemon-battle",
    {
      title: "Pokemon Battle",
      description:
        "Simulate a battle between two Pokemon. Returns battle stats, winner, and requests AI to write an exciting battle narrative.",
      inputSchema: {
        pokemon1: z.string().describe("Name of the first Pokemon"),
        pokemon2: z.string().describe("Name of the second Pokemon"),
      },
    },
    async ({ pokemon1, pokemon2 }) => {
      // Fetch both Pokemon
      const [fighter1, fighter2] = await Promise.all([
        fetchPokemon(pokemon1),
        fetchPokemon(pokemon2),
      ]);

      // Validate both Pokemon exist
      const errors: string[] = [];
      if (!fighter1) {
        errors.push(`"${pokemon1}" is not a valid Pokemon`);
      }
      if (!fighter2) {
        errors.push(`"${pokemon2}" is not a valid Pokemon`);
      }

      if (errors.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `Battle cannot proceed!\n\n${errors.join("\n")}\n\nPlease provide valid Pokemon names (e.g., pikachu, charizard, mewtwo).`,
            },
          ],
          isError: true,
        };
      }

      // At this point, both fighters are guaranteed to exist
      const pokemon1Data = fighter1 as Pokemon;
      const pokemon2Data = fighter2 as Pokemon;

      const score1 = calculateBattleScore(pokemon1Data);
      const score2 = calculateBattleScore(pokemon2Data);

      const winner = score1 > score2 ? pokemon1Data : pokemon2Data;
      const loser = score1 > score2 ? pokemon2Data : pokemon1Data;
      const winnerScore = Math.max(score1, score2);
      const loserScore = Math.min(score1, score2);
      const wasClose = Math.abs(score1 - score2) < 50;

      // Build battle report
      const battleReport = {
        battle: {
          fighter1: {
            name: pokemon1Data.name.toUpperCase(),
            types: pokemon1Data.types,
            stats: pokemon1Data.stats,
            totalStats: pokemon1Data.totalStats,
            battleScore: score1,
            sprite: pokemon1Data.sprite,
          },
          fighter2: {
            name: pokemon2Data.name.toUpperCase(),
            types: pokemon2Data.types,
            stats: pokemon2Data.stats,
            totalStats: pokemon2Data.totalStats,
            battleScore: score2,
            sprite: pokemon2Data.sprite,
          },
        },
        result: {
          winner: winner.name.toUpperCase(),
          loser: loser.name.toUpperCase(),
          winnerScore,
          loserScore,
          margin: winnerScore - loserScore,
          wasClose,
          victoryType: wasClose ? "narrow victory" : "decisive victory",
        },
      };

      const narrativePrompt = `
---
BATTLE COMPLETE! Please write an exciting 2-paragraph Pokemon battle story based on these results:

**${pokemon1Data.name.toUpperCase()}** (${pokemon1Data.types.join("/")}) vs **${pokemon2Data.name.toUpperCase()}** (${pokemon2Data.types.join("/")})

Winner: **${winner.name.toUpperCase()}** with a ${wasClose ? "narrow" : "decisive"} victory!

Key stats to reference:
- ${pokemon1Data.name}: Attack ${pokemon1Data.stats["attack"]}, Sp.Atk ${pokemon1Data.stats["special-attack"]}, Speed ${pokemon1Data.stats["speed"]}
- ${pokemon2Data.name}: Attack ${pokemon2Data.stats["attack"]}, Sp.Atk ${pokemon2Data.stats["special-attack"]}, Speed ${pokemon2Data.stats["speed"]}

Make it dramatic and reference their types and signature moves!
---`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(battleReport, null, 2),
          },
          {
            type: "text",
            text: narrativePrompt,
          },
        ],
      };
    }
  );
}
