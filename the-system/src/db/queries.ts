import { getDb } from './database';
import type {
  Hero,
  Discipline,
  DisciplineLog,
  SilenceStreak,
  Cosmetic,
  Mandate,
} from '../types';

export async function getHero(): Promise<Hero | null> {
  return getDb().getFirstAsync<Hero>('SELECT * FROM hero WHERE id = 1');
}

export async function createHero(
  name: string,
  heroClass: string,
  journeyStartDate: string
): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO hero (id, name, hero_class, global_xp, global_level, rank, journey_start_date, journey_complete)
     VALUES (1, ?, ?, 0, 1, 'E', ?, 0)`,
    [name, heroClass, journeyStartDate]
  );
}

export async function updateHero(
  fields: Partial<Pick<Hero, 'global_xp' | 'global_level' | 'rank' | 'journey_complete'>>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value as string | number);
  }
  if (sets.length === 0) return;
  await getDb().runAsync(`UPDATE hero SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function getAllDisciplines(): Promise<Discipline[]> {
  return getDb().getAllAsync<Discipline>('SELECT * FROM disciplines ORDER BY id');
}

export async function getActiveDisciplines(): Promise<Discipline[]> {
  return getDb().getAllAsync<Discipline>(
    'SELECT * FROM disciplines WHERE is_active = 1 ORDER BY id'
  );
}

export async function getDiscipline(id: number): Promise<Discipline | null> {
  return getDb().getFirstAsync<Discipline>('SELECT * FROM disciplines WHERE id = ?', [id]);
}

export async function getDisciplineByCode(code: string): Promise<Discipline | null> {
  return getDb().getFirstAsync<Discipline>('SELECT * FROM disciplines WHERE code = ?', [code]);
}

export async function getLog(
  disciplineId: number,
  date: string
): Promise<DisciplineLog | null> {
  return getDb().getFirstAsync<DisciplineLog>(
    'SELECT * FROM discipline_logs WHERE discipline_id = ? AND log_date = ?',
    [disciplineId, date]
  );
}

export async function getLogsForDate(date: string): Promise<DisciplineLog[]> {
  return getDb().getAllAsync<DisciplineLog>(
    'SELECT * FROM discipline_logs WHERE log_date = ?',
    [date]
  );
}

export async function insertLog(
  disciplineId: number,
  date: string,
  completed: boolean,
  failed: boolean,
  xpDelta: number
): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO discipline_logs (discipline_id, log_date, completed, failed, xp_delta, logged_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [disciplineId, date, completed ? 1 : 0, failed ? 1 : 0, xpDelta, new Date().toISOString()]
  );
}

export async function getStreak(disciplineId: number, beforeDate: string): Promise<number> {
  const logs = await getDb().getAllAsync<DisciplineLog>(
    `SELECT * FROM discipline_logs
     WHERE discipline_id = ? AND log_date < ? AND completed = 1
     ORDER BY log_date DESC`,
    [disciplineId, beforeDate]
  );

  let streak = 0;
  const date = new Date(beforeDate);
  for (let i = 0; i < logs.length; i++) {
    date.setDate(date.getDate() - 1);
    const expected = date.toISOString().slice(0, 10);
    if (logs[i].log_date === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function getSilenceStreak(): Promise<SilenceStreak | null> {
  return getDb().getFirstAsync<SilenceStreak>('SELECT * FROM silence_streak WHERE id = 1');
}

export async function updateSilenceStreak(
  fields: Partial<SilenceStreak>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'id') continue;
    sets.push(`${key} = ?`);
    values.push(value as string | number | null);
  }
  if (sets.length === 0) return;
  await getDb().runAsync(`UPDATE silence_streak SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function getPendingMandate(): Promise<Mandate | null> {
  return getDb().getFirstAsync<Mandate>(
    'SELECT * FROM mandates WHERE opened = 0 ORDER BY granted_at DESC LIMIT 1'
  );
}

export async function createMandate(tier: string): Promise<number> {
  const result = await getDb().runAsync(
    'INSERT INTO mandates (tier, opened, granted_at) VALUES (?, 0, ?)',
    [tier, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function openMandate(
  id: number,
  lootType: string,
  lootId: number
): Promise<void> {
  await getDb().runAsync(
    'UPDATE mandates SET opened = 1, opened_at = ?, loot_type = ?, loot_id = ? WHERE id = ?',
    [new Date().toISOString(), lootType, lootId, id]
  );
}

export async function getSystemState(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM system_state WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSystemState(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function getCosmetics(): Promise<Cosmetic[]> {
  return getDb().getAllAsync<Cosmetic>('SELECT * FROM cosmetics ORDER BY type, tier');
}

export async function getEquippedCosmetics(): Promise<Cosmetic[]> {
  return getDb().getAllAsync<Cosmetic>(
    'SELECT * FROM cosmetics WHERE equipped = 1 ORDER BY type'
  );
}

export async function unlockCosmetic(id: number): Promise<void> {
  await getDb().runAsync(
    'UPDATE cosmetics SET unlocked = 1, unlocked_at = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function equipCosmetic(id: number, type: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE cosmetics SET equipped = 0 WHERE type = ?', [type]);
  await db.runAsync('UPDATE cosmetics SET equipped = 1 WHERE id = ?', [id]);
}

export async function getWeekCompletionRate(
  journeyStartDate: string,
  weekNumber: number
): Promise<number> {
  const start = new Date(journeyStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const total = await getDb().getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM discipline_logs
     WHERE log_date >= ? AND log_date < ?`,
    [startStr, endStr]
  );
  const completed = await getDb().getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM discipline_logs
     WHERE log_date >= ? AND log_date < ? AND completed = 1`,
    [startStr, endStr]
  );

  const totalCount = total?.cnt ?? 0;
  if (totalCount === 0) return 0;
  return (completed?.cnt ?? 0) / totalCount;
}

export async function get180DayConsistencyRate(): Promise<number> {
  const total = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM discipline_logs'
  );
  const completed = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM discipline_logs WHERE completed = 1'
  );
  const totalCount = total?.cnt ?? 0;
  if (totalCount === 0) return 0;
  return (completed?.cnt ?? 0) / totalCount;
}
