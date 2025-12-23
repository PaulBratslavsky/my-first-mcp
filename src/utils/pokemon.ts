// Pokemon types
export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: Record<string, number>;
  totalStats: number;
  sprite: string;
}

export interface PokemonDetails extends Pokemon {
  height: number;
  weight: number;
  abilities: string[];
  sprites: {
    front: string;
    back: string;
  };
}

export interface PokemonListItem {
  name: string;
  id: string;
}

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

/**
 * Fetch basic Pokemon data for battles
 */
export async function fetchPokemon(name: string): Promise<Pokemon | null> {
  const response = await fetch(
    `${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`
  );
  if (!response.ok) return null;

  const data = await response.json();
  const stats: Record<string, number> = {};
  data.stats.forEach((s: { stat: { name: string }; base_stat: number }) => {
    stats[s.stat.name] = s.base_stat;
  });

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t: { type: { name: string } }) => t.type.name),
    stats,
    totalStats: Object.values(stats).reduce((a, b) => a + b, 0),
    sprite: data.sprites.front_default,
  };
}

/**
 * Fetch detailed Pokemon data for resources
 */
export async function fetchPokemonDetails(
  name: string
): Promise<PokemonDetails | null> {
  const response = await fetch(
    `${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`
  );
  if (!response.ok) return null;

  const data = await response.json();
  const stats: Record<string, number> = {};
  data.stats.forEach((s: { stat: { name: string }; base_stat: number }) => {
    stats[s.stat.name] = s.base_stat;
  });

  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types.map((t: { type: { name: string } }) => t.type.name),
    abilities: data.abilities.map(
      (a: { ability: { name: string } }) => a.ability.name
    ),
    stats,
    totalStats: Object.values(stats).reduce((a, b) => a + b, 0),
    sprite: data.sprites.front_default,
    sprites: {
      front: data.sprites.front_default,
      back: data.sprites.back_default,
    },
  };
}

/**
 * Fetch list of Pokemon
 */
export async function fetchPokemonList(
  limit = 50
): Promise<PokemonListItem[]> {
  const response = await fetch(`${POKEAPI_BASE}/pokemon?limit=${limit}`);
  const data = await response.json();

  return data.results.map((p: { name: string; url: string }) => ({
    name: p.name,
    id: p.url.split("/").filter(Boolean).pop(),
  }));
}

/**
 * Calculate battle score for a Pokemon
 */
export function calculateBattleScore(pokemon: Pokemon): number {
  const attack = pokemon.stats["attack"] || 0;
  const spAttack = pokemon.stats["special-attack"] || 0;
  const defense = pokemon.stats["defense"] || 0;
  const spDefense = pokemon.stats["special-defense"] || 0;
  const speed = pokemon.stats["speed"] || 0;
  const hp = pokemon.stats["hp"] || 0;

  // Weighted score with randomness (10-20% variance)
  const baseScore =
    attack * 1.2 +
    spAttack * 1.1 +
    defense * 0.8 +
    spDefense * 0.7 +
    speed * 1.0 +
    hp * 0.9;

  const randomFactor = 0.9 + Math.random() * 0.2;
  return Math.round(baseScore * randomFactor);
}
