import {
  getPendingMandate,
  openMandate as openMandateQuery,
  createMandate,
  getSystemState,
  setSystemState,
  addCosmetic,
  findCosmetic,
  getEquippedCosmetics,
  equipCosmetic,
} from '../db/queries';
import type { MandateTier } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface LootEntry {
  type: string;
  weight: number;
  items: string[];
}

export interface LootResult {
  type: string;
  name: string;
}

const SCROLLS = [
  'The man who moves a mountain begins by carrying small stones.',
  'Your discipline today is your freedom tomorrow.',
  'The forge does not ask if you are ready. It only asks if you will step in.',
  'Weakness is a choice. So is strength.',
  'You are not built in the moments of ease. You are built in the fire.',
  'The System sees what others cannot: your potential.',
  'Every sunrise you claim is a victory against your former self.',
  'Silence is not absence. It is mastery.',
  'The iron remembers every rep. So does your future.',
  'A king is not crowned. He crowns himself through daily conquest.',
  'The scroll opens for those who seek. You sought. You found.',
  'Consistency is the throne upon which greatness sits.',
  'The night belongs to those who earned their rest.',
  'Your covenant is not with others. It is with yourself.',
  'When the world sleeps, the disciplined rise.',
  'There is no shortcut to the summit. Only steps.',
  'The System does not judge your past. Only your present.',
  'What you resist today becomes what you conquer tomorrow.',
  'An empire is built one disciplined day at a time.',
  'You were not chosen at random. The System sees your fire.',
];

const TITLES_COMMON = [
  'Stone Breaker', 'Dawn Riser', 'Iron Will', 'Night Watcher',
  'Path Walker', 'Ember Keeper', 'Dust Shaker', 'Oath Bound',
  'Grit Bearer', 'Steel Minded',
];

const TITLES_RARE = [
  'Shadow Conqueror', 'Flame Forged', 'Crown Seeker',
  'Void Walker', 'Storm Bringer',
];

const TITLES_LEGENDARY = [
  'The Sovereign', 'Chosen of the System', 'The Unbroken',
  'Divine Will', 'The Transcendent',
];

const ACCESSORIES = [
  'Battle Scar', 'Iron Earring', 'War Paint', 'Pixel Tattoo',
  'Eye Patch', 'Chain Pendant',
];

export const LOOT_TABLES: Record<string, LootEntry[]> = {
  BRONZE: [
    { type: 'scroll', weight: 0.6, items: SCROLLS },
    { type: 'title', weight: 0.3, items: TITLES_COMMON },
    { type: 'accessory', weight: 0.1, items: ACCESSORIES },
  ],
  SILVER: [
    { type: 'cosmetic_variant', weight: 0.5, items: ['Weapon Skin: Crimson', 'Weapon Skin: Frost', 'Armor Skin: Shadow', 'Armor Skin: Bronze'] },
    { type: 'background', weight: 0.3, items: ['Volcanic Ruins', 'Frozen Throne', 'Desert Citadel', 'Ocean Depths'] },
    { type: 'title', weight: 0.2, items: TITLES_RARE },
  ],
  GOLD: [
    { type: 'equipment_tier', weight: 0.4, items: ['Weapon Tier Unlock', 'Armor Tier Unlock', 'Crown of Ascension'] },
    { type: 'aura_variant', weight: 0.4, items: ['Crimson Aura', 'Frost Aura', 'Shadow Aura', 'Divine Aura'] },
    { type: 'title', weight: 0.2, items: TITLES_LEGENDARY },
  ],
};

export function rollLoot(tier: string): LootResult {
  const table = LOOT_TABLES[tier] ?? LOOT_TABLES.BRONZE;
  const roll = Math.random();

  let cumulative = 0;
  for (const entry of table) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      const item = entry.items[Math.floor(Math.random() * entry.items.length)];
      return { type: entry.type, name: item };
    }
  }

  const fallback = table[0];
  return {
    type: fallback.type,
    name: fallback.items[Math.floor(Math.random() * fallback.items.length)],
  };
}

/** Equippable slot types — these auto-equip when their tier beats the current. */
const EQUIP_SLOTS = ['weapon', 'armor', 'crown', 'accessory', 'aura', 'background'];

export interface MappedCosmetic {
  type: 'weapon' | 'armor' | 'crown' | 'title' | 'background' | 'accessory' | 'aura';
  tier: number;
  name: string;
}

/**
 * Translate a rolled loot result into a persistable cosmetic. Returns null for
 * purely flavour loot (scrolls are motivational quotes, nothing to keep).
 */
export function lootToCosmetic(loot: LootResult): MappedCosmetic | null {
  switch (loot.type) {
    case 'scroll':
      return null;
    case 'title':
      return { type: 'title', tier: 1, name: loot.name };
    case 'accessory':
      return { type: 'accessory', tier: 1, name: loot.name };
    case 'aura_variant':
      return { type: 'aura', tier: 2, name: loot.name };
    case 'background':
      return { type: 'background', tier: 1, name: loot.name };
    case 'cosmetic_variant':
      if (loot.name.startsWith('Armor')) return { type: 'armor', tier: 2, name: loot.name };
      return { type: 'weapon', tier: 2, name: loot.name };
    case 'equipment_tier':
      if (loot.name.startsWith('Armor')) return { type: 'armor', tier: 3, name: loot.name };
      if (loot.name.startsWith('Crown')) return { type: 'crown', tier: 3, name: loot.name };
      return { type: 'weapon', tier: 3, name: loot.name };
    default:
      return { type: 'accessory', tier: 1, name: loot.name };
  }
}

/** Persist a rolled loot as an unlocked cosmetic, auto-equipping slot items. */
async function persistLoot(loot: LootResult): Promise<number> {
  const mapped = lootToCosmetic(loot);
  if (!mapped) return 0; // flavour-only (scroll)

  // De-dupe: never store the same item twice — reuse the existing row.
  const existing = await findCosmetic(mapped.type, mapped.name);
  const id = existing ? existing.id : await addCosmetic(mapped.type, mapped.tier, mapped.name);

  if (EQUIP_SLOTS.includes(mapped.type)) {
    const equipped = await getEquippedCosmetics();
    const current = equipped.find((c) => c.type === mapped.type);
    if (!current || mapped.tier >= current.tier) {
      await equipCosmetic(id, mapped.type);
    }
  }
  return id;
}

export async function openCurrentMandate(): Promise<LootResult | null> {
  const mandate = await getPendingMandate();
  if (!mandate) return null;
  const loot = rollLoot(mandate.tier);
  const lootId = await persistLoot(loot);
  await openMandateQuery(mandate.id, loot.type, lootId);
  return loot;
}

export async function requestManualMandate(today: string): Promise<boolean> {
  const lastDate = await getSystemState('last_manual_mandate_date');
  if (lastDate) {
    const daysSince = differenceInDays(parseISO(today), parseISO(lastDate));
    if (daysSince < 7) return false;
  }
  const pending = await getPendingMandate();
  if (pending) return false;
  await createMandate('BRONZE');
  await setSystemState('last_manual_mandate_date', today);
  return true;
}
