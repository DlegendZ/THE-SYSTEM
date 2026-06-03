import type { SQLiteDatabase } from 'expo-sqlite';
import type { Migration } from './index';

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      CREATE TABLE hero (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name TEXT NOT NULL DEFAULT 'Raynald Arvan Lim',
        hero_class TEXT NOT NULL DEFAULT 'Warrior',
        global_xp INTEGER NOT NULL DEFAULT 0,
        global_level INTEGER NOT NULL DEFAULT 1,
        rank TEXT NOT NULL DEFAULT 'E',
        journey_start_date TEXT NOT NULL,
        journey_complete INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE disciplines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        xp_gain INTEGER NOT NULL,
        xp_loss INTEGER NOT NULL,
        deadline_time TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_custom INTEGER NOT NULL DEFAULT 0,
        frequency TEXT NOT NULL DEFAULT 'daily',
        active_days TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE discipline_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discipline_id INTEGER NOT NULL REFERENCES disciplines(id),
        log_date TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        xp_delta INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        logged_at TEXT NOT NULL,
        UNIQUE(discipline_id, log_date)
      );

      CREATE TABLE silence_streak (
        id INTEGER PRIMARY KEY DEFAULT 1,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_success_date TEXT,
        total_relapses INTEGER NOT NULL DEFAULT 0,
        last_relapse_date TEXT
      );

      CREATE TABLE cosmetics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        tier INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        equipped INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT
      );

      CREATE TABLE mandates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tier TEXT NOT NULL,
        opened INTEGER NOT NULL DEFAULT 0,
        granted_at TEXT NOT NULL,
        opened_at TEXT,
        loot_type TEXT,
        loot_id INTEGER
      );

      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        category TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        fired INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE system_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    const disciplines = [
      ['RISE', 'Wake Before Dawn', 'Out of bed by 08:30. The day belongs to those who claim it first.', 'HARD', 50, 30, '08:30'],
      ['REST', 'Night Silence', 'Phone down, lights off before 23:00. Recovery is strategy.', 'HARD', 50, 30, '23:00'],
      ['NOURISH', 'Clean Fuel', 'One clean meal log. No processed poison. Your body is armor.', 'NORMAL', 25, 15, '23:59'],
      ['SILENCE', 'The Silence Protocol', 'The war against the mind\'s weakest impulse. Streak is sacred.', 'LEGENDARY', 100, 0, null],
      ['FORGE', 'Iron Temple', 'Lifting or cardio. The Iron Temple does not close.', 'HARD', 60, 35, '23:59'],
      ['KNOWLEDGE', 'The Scroll', 'Minimum 10 pages of a real book read today.', 'NORMAL', 25, 15, '23:59'],
      ['PRESENCE', 'The Veil', 'Instagram & TikTok under 30 minutes today. Auto-tracked.', 'NORMAL', 25, 15, '23:59'],
      ['RITUAL', 'The Ritual', 'Daily skincare routine completed. Discipline in small things.', 'EASY', 10, 5, '23:59'],
    ];

    for (const d of disciplines) {
      await db.runAsync(
        `INSERT INTO disciplines (code, name, description, difficulty, xp_gain, xp_loss, deadline_time, is_active, is_custom, frequency, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'daily', ?)`,
        [...d, now]
      );
    }

    await db.runAsync(
      'INSERT INTO silence_streak (id, current_streak, longest_streak, total_relapses) VALUES (1, 0, 0, 0)'
    );

    await db.runAsync(
      "INSERT INTO system_state (key, value) VALUES ('onboarding_complete', '0')"
    );
    await db.runAsync(
      "INSERT INTO system_state (key, value) VALUES ('shield_active', '0')"
    );
  },
};
