import { create } from 'zustand';
import { initDatabase, getDb } from '../db/database';
import {
  getHero,
  createHero,
  getAllDisciplines,
  getActiveDisciplines,
  getLogsForDate,
  getSilenceStreak,
  getPendingMandate,
  getCosmetics,
  equipCosmetic as dbEquipCosmetic,
  getSystemState,
  setSystemState,
  importData as dbImportData,
  type ExportBundle,
} from '../db/queries';
import { applyCosmeticTheme } from '../engine/cosmeticEffects';
import {
  completeDiscipline as xpComplete,
  failDiscipline as xpFail,
  triggerRelapse as xpRelapse,
} from '../engine/xpEngine';
import { openCurrentMandate, requestManualMandate } from '../engine/mandateEngine';
import { getThemeForRank } from '../theme/rankThemes';
import { runMissedMidnights } from '../engine/midnightEngine';
import { initNotifications } from '../notifications/setup';
import { scheduleNotifications } from '../notifications/scheduler';
import { format, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import type {
  Hero,
  Discipline,
  DisciplineLog,
  SilenceStreak,
  Mandate,
  Cosmetic,
  HeroClass,
  Rank,
} from '../types';
import type { RankTheme } from '../theme/rankThemes';
import type { LevelUpEvent } from '../engine/xpEngine';
import type { LootResult } from '../engine/mandateEngine';

interface SystemState {
  initialized: boolean;
  hero: Hero | null;
  disciplines: Discipline[];
  todayLogs: DisciplineLog[];
  silenceStreak: SilenceStreak | null;
  cosmetics: Cosmetic[];
  currentTheme: RankTheme;
  pendingMandate: Mandate | null;
  onboardingComplete: boolean;
  /** True for the rest of the day after a relapse — trials are locked. */
  relapseLocked: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  createNewHero: (name: string, heroClass: HeroClass) => Promise<void>;
  completeDiscipline: (id: number) => Promise<{ xpGained: number; levelUp: LevelUpEvent | null }>;
  failDiscipline: (id: number) => Promise<void>;
  triggerRelapse: () => Promise<void>;
  openMandate: () => Promise<LootResult | null>;
  requestMandate: () => Promise<boolean>;
  equipCosmetic: (id: number, type: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetJourney: () => Promise<void>;
  importJourney: (bundle: ExportBundle) => Promise<void>;
  syncNotifications: () => Promise<void>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useSystemStore = create<SystemState>((set, get) => ({
  initialized: false,
  hero: null,
  disciplines: [],
  todayLogs: [],
  silenceStreak: null,
  cosmetics: [],
  currentTheme: getThemeForRank('E'),
  pendingMandate: null,
  onboardingComplete: false,
  relapseLocked: false,

  initialize: async () => {
    if (get().initialized) return;
    await initDatabase();
    const onboarding = await getSystemState('onboarding_complete');
    const hero = await getHero();

    set({
      initialized: true,
      onboardingComplete: onboarding === '1',
      hero,
      currentTheme: getThemeForRank((hero?.rank as Rank) ?? 'E'),
    });

    if (hero) {
      // Catch up any days that elapsed while the app was closed (auto-fail
      // missed trials, advance the silence streak) before showing state.
      await runMissedMidnights();
      await get().refresh();
    }

    await initNotifications();
    if (hero) await get().syncNotifications();
  },

  refresh: async () => {
    // Parallel — these are independent reads; sequential awaits made every
    // refresh (after each complete/fail/equip) feel sluggish.
    const [hero, disciplines, todayLogs, silenceStreak, pendingMandate, cosmetics, relapseLockDate] =
      await Promise.all([
        getHero(),
        getAllDisciplines(),
        getLogsForDate(today()),
        getSilenceStreak(),
        getPendingMandate(),
        getCosmetics(),
        getSystemState('relapse_lock_date'),
      ]);

    set({
      hero,
      disciplines,
      todayLogs,
      silenceStreak,
      pendingMandate,
      cosmetics,
      relapseLocked: relapseLockDate === today(),
      currentTheme: applyCosmeticTheme(getThemeForRank((hero?.rank as Rank) ?? 'E'), cosmetics),
    });
  },

  createNewHero: async (name: string, heroClass: HeroClass) => {
    // Use the local calendar date, not UTC — toISOString() can roll back a day
    // for users east of UTC late at night.
    await createHero(name, heroClass, today());
    // Anchor the midnight settler at yesterday so the FIRST day in play
    // (today) gets settled on the next launch. Without this, runMissedMidnights
    // sees a null marker on its first real run, treats it as a brand-new device,
    // and silently skips settling day 1 — the bug where day-1 losses never apply.
    await setSystemState('last_midnight_date', format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    await get().refresh();
    await get().syncNotifications();
  },

  completeDiscipline: async (id: number) => {
    // Trials are locked for the rest of the day after a relapse.
    if (get().relapseLocked) return { xpGained: 0, levelUp: null };
    const result = await xpComplete(id, today());
    await get().refresh();
    await get().syncNotifications();
    return result;
  },

  failDiscipline: async (id: number) => {
    if (get().relapseLocked) return;
    await xpFail(id, today());
    await get().refresh();
    await get().syncNotifications();
  },

  triggerRelapse: async () => {
    // Soft reset: zero progress + wipe history, keep identity, bump the relapse
    // record. Stays in the app (no re-onboarding).
    await xpRelapse(today());
    await get().refresh();
    await get().syncNotifications();
  },

  openMandate: async () => {
    const loot = await openCurrentMandate();
    await get().refresh();
    return loot;
  },

  requestMandate: async () => {
    // No petitions on a relapse-locked day.
    if (get().relapseLocked) return false;
    const success = await requestManualMandate(today());
    if (success) await get().refresh();
    return success;
  },

  equipCosmetic: async (id: number, type: string) => {
    await dbEquipCosmetic(id, type);
    await get().refresh();
  },

  completeOnboarding: async () => {
    await setSystemState('onboarding_complete', '1');
    set({ onboardingComplete: true });
  },

  importJourney: async (bundle: ExportBundle) => {
    await dbImportData(bundle);
    // Run settlement like a fresh launch: catch up missed days, advance the
    // silence streak, and (crucially) fire the weekly milestone check so a
    // 24-week-old imported journey triggers the Final Judgement.
    await runMissedMidnights();
    // Reflect the imported onboarding flag so the navigator lands on the right
    // screen, then reload all derived state from the freshly written DB.
    const onboarding = await getSystemState('onboarding_complete');
    set({ onboardingComplete: onboarding === '1' });
    await get().refresh();
    await get().syncNotifications();
  },

  syncNotifications: async () => {
    const hero = get().hero;
    if (!hero) return;
    const intervalStr = await getSystemState('notification_interval');
    const qs = await getSystemState('quiet_start');
    const qe = await getSystemState('quiet_end');
    const interval = intervalStr ? parseInt(intervalStr, 10) : 3;
    const quietStart = qs ? parseInt(qs.split(':')[0], 10) : 0;
    const quietEnd = qe ? parseInt(qe.split(':')[0], 10) : 7;
    const streak = get().silenceStreak?.current_streak ?? 0;

    // Snapshot today's progress so each scheduled notification reports how many
    // trials are still undone. Disciplines only change while the app is open
    // (and we reschedule on every change), so the baked count stays accurate
    // during the app-closed window when notifications actually fire.
    const active = await getActiveDisciplines();
    const logs = await getLogsForDate(today());
    const resolved = new Set(
      logs.filter((l) => l.completed || l.failed).map((l) => l.discipline_id)
    );
    const total = active.length;
    const undone = active.filter((d) => !resolved.has(d.id)).length;
    const day = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date)) + 1;

    await scheduleNotifications(interval, quietStart, quietEnd, {
      streak,
      level: hero.global_level,
      rank: hero.rank as Rank,
      heroClass: hero.hero_class,
      total,
      undone,
      day,
    });
  },

  resetJourney: async () => {
    const db = getDb();
    await db.runAsync('DELETE FROM hero');
    await db.runAsync('DELETE FROM discipline_logs');
    await db.runAsync('DELETE FROM silence_streak');
    await db.runAsync('DELETE FROM cosmetics');
    await db.runAsync('DELETE FROM mandates');
    await db.runAsync("DELETE FROM system_state WHERE key != 'notification_interval'");
    // Reset in-memory state directly. initialize() can't be reused here because
    // it early-returns once initialized; flipping onboardingComplete sends the
    // navigator back to the Awakening flow.
    set({
      hero: null,
      disciplines: [],
      todayLogs: [],
      silenceStreak: null,
      cosmetics: [],
      pendingMandate: null,
      onboardingComplete: false,
      relapseLocked: false,
      currentTheme: getThemeForRank('E'),
    });
  },
}));
