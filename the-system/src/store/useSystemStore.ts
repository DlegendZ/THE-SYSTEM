import { create } from 'zustand';
import { initDatabase } from '../db/database';
import {
  getHero,
  createHero,
  getAllDisciplines,
  getLogsForDate,
  getSilenceStreak,
  getPendingMandate,
  getSystemState,
  setSystemState,
} from '../db/queries';
import {
  completeDiscipline as xpComplete,
  failDiscipline as xpFail,
  triggerRelapse as xpRelapse,
} from '../engine/xpEngine';
import { openCurrentMandate, requestManualMandate } from '../engine/mandateEngine';
import { getThemeForRank } from '../theme/rankThemes';
import { format } from 'date-fns';
import type {
  Hero,
  Discipline,
  DisciplineLog,
  SilenceStreak,
  Mandate,
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
  currentTheme: RankTheme;
  pendingMandate: Mandate | null;
  onboardingComplete: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  createNewHero: (name: string, heroClass: HeroClass) => Promise<void>;
  completeDiscipline: (id: number) => Promise<{ xpGained: number; levelUp: LevelUpEvent | null }>;
  failDiscipline: (id: number) => Promise<void>;
  triggerRelapse: () => Promise<void>;
  openMandate: () => Promise<LootResult | null>;
  requestMandate: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useSystemStore = create<SystemState>((set, get) => ({
  initialized: false,
  hero: null,
  disciplines: [],
  todayLogs: [],
  silenceStreak: null,
  currentTheme: getThemeForRank('E'),
  pendingMandate: null,
  onboardingComplete: false,

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
      await get().refresh();
    }
  },

  refresh: async () => {
    const hero = await getHero();
    const disciplines = await getAllDisciplines();
    const todayLogs = await getLogsForDate(today());
    const silenceStreak = await getSilenceStreak();
    const pendingMandate = await getPendingMandate();

    set({
      hero,
      disciplines,
      todayLogs,
      silenceStreak,
      pendingMandate,
      currentTheme: getThemeForRank((hero?.rank as Rank) ?? 'E'),
    });
  },

  createNewHero: async (name: string, heroClass: HeroClass) => {
    await createHero(name, heroClass, new Date().toISOString().slice(0, 10));
    await get().refresh();
  },

  completeDiscipline: async (id: number) => {
    const result = await xpComplete(id, today());
    await get().refresh();
    return result;
  },

  failDiscipline: async (id: number) => {
    await xpFail(id, today());
    await get().refresh();
  },

  triggerRelapse: async () => {
    await xpRelapse(today());
    await get().refresh();
  },

  openMandate: async () => {
    const loot = await openCurrentMandate();
    await get().refresh();
    return loot;
  },

  requestMandate: async () => {
    const success = await requestManualMandate(today());
    if (success) await get().refresh();
    return success;
  },

  completeOnboarding: async () => {
    await setSystemState('onboarding_complete', '1');
    set({ onboardingComplete: true });
  },
}));
