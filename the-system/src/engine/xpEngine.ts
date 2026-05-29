import { getDb } from '../db/database';
import {
  getHero,
  getDiscipline,
  getStreak,
  insertLog,
  updateHero,
  getSilenceStreak,
  updateSilenceStreak,
  createMandate,
  getPendingMandate,
} from '../db/queries';
import { getStreakMultiplier, getRankForLevel, getXpForLevel } from './xpConstants';
import type { Hero, Rank } from '../types';

export interface LevelUpEvent {
  newLevel: number;
  newRank: Rank;
  rankChanged: boolean;
}

export async function completeDiscipline(
  disciplineId: number,
  date: string
): Promise<{ xpGained: number; levelUp: LevelUpEvent | null }> {
  const discipline = await getDiscipline(disciplineId);
  if (!discipline) throw new Error(`Discipline ${disciplineId} not found`);

  const streak = await getStreak(disciplineId, date);
  const multiplier = getStreakMultiplier(streak);
  const xpGained = Math.round(discipline.xp_gain * multiplier);

  await insertLog(disciplineId, date, true, false, xpGained);
  await addGlobalXP(xpGained);

  const levelUp = await checkLevelUp();
  return { xpGained, levelUp };
}

export async function failDiscipline(
  disciplineId: number,
  date: string
): Promise<void> {
  const discipline = await getDiscipline(disciplineId);
  if (!discipline) throw new Error(`Discipline ${disciplineId} not found`);

  if (discipline.code === 'SILENCE') {
    await triggerRelapse(date);
    return;
  }

  const xpLost = discipline.xp_loss;
  await insertLog(disciplineId, date, false, true, -xpLost);
  await deductGlobalXP(xpLost);
}

export async function triggerRelapse(date: string): Promise<void> {
  const db = getDb();

  await db.runAsync(
    "UPDATE hero SET global_xp = 0, global_level = 1, rank = 'E' WHERE id = 1"
  );

  await updateSilenceStreak({
    current_streak: 0,
    last_relapse_date: date,
  });

  await db.runAsync(
    `UPDATE silence_streak SET total_relapses = total_relapses + 1 WHERE id = 1`
  );

  await db.runAsync(
    "UPDATE cosmetics SET equipped = 0 WHERE type = 'weapon'"
  );

  const silenceDiscipline = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM disciplines WHERE code = 'SILENCE'"
  );
  if (silenceDiscipline) {
    await insertLog(silenceDiscipline.id, date, false, true, 0);
  }
}

async function addGlobalXP(amount: number): Promise<void> {
  const hero = await getHero();
  if (!hero) return;
  const newXP = hero.global_xp + amount;
  await updateHero({ global_xp: newXP });
}

async function deductGlobalXP(amount: number): Promise<void> {
  const hero = await getHero();
  if (!hero) return;
  const newXP = Math.max(0, hero.global_xp - amount);
  await updateHero({ global_xp: newXP });
}

async function checkLevelUp(): Promise<LevelUpEvent | null> {
  const hero = await getHero();
  if (!hero) return null;

  const nextLevelXP = getXpForLevel(hero.global_level + 1);
  if (nextLevelXP === null) return null;
  if (hero.global_xp < nextLevelXP) return null;

  const newLevel = hero.global_level + 1;
  const newRank = getRankForLevel(newLevel);
  const rankChanged = newRank !== hero.rank;

  await updateHero({ global_level: newLevel, rank: newRank });

  const pendingMandate = await getPendingMandate();
  if (!pendingMandate) {
    await grantMandate(newLevel);
  }

  return { newLevel, newRank, rankChanged };
}

async function grantMandate(newLevel: number): Promise<void> {
  let tier = 'BRONZE';
  if (newLevel % 10 === 0) tier = 'GOLD';
  else if (newLevel % 5 === 0) tier = 'SILVER';
  await createMandate(tier);
}
