import {
  getActiveDisciplines,
  getLog,
  getSilenceStreak,
  updateSilenceStreak,
  getHero,
  getSystemState,
  setSystemState,
  get180DayConsistencyRate,
  updateHero,
} from '../db/queries';
import { failDiscipline, completeDiscipline } from './xpEngine';
import {
  format,
  subDays,
  addDays,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns';
import UsageStatsModule from '../native/UsageStatsModule';

const LAST_SETTLED_KEY = 'last_midnight_date';
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * Settle every day that has elapsed since the last time we ran, up to and
 * including yesterday. Called once on app launch (store.initialize) so missed
 * days are caught up — there is no real background scheduler.
 *
 * Today is never settled: its disciplines are still in play until midnight.
 */
export async function runMissedMidnights(): Promise<void> {
  const hero = await getHero();
  if (!hero) return;

  const yesterday = fmt(subDays(new Date(), 1));
  const last = await getSystemState(LAST_SETTLED_KEY);

  // First run on a device with no marker: don't retroactively punish days we
  // were never tracking. Anchor at yesterday and start settling from tomorrow.
  if (!last) {
    await setSystemState(LAST_SETTLED_KEY, yesterday);
    return;
  }

  const end = parseISO(yesterday);
  let cursor = addDays(parseISO(last), 1);

  const pending: string[] = [];
  while (cursor <= end) {
    pending.push(fmt(cursor));
    cursor = addDays(cursor, 1);
  }
  if (pending.length === 0) return; // already settled through yesterday

  for (const date of pending) {
    // Screen-time auto-check only works for the most recent day (UsageStats
    // reports today's totals); older missed days skip the Veil auto-fail.
    await settleDay(date, date === yesterday);
  }

  await setSystemState(LAST_SETTLED_KEY, yesterday);
  await checkWeeklyMilestone();
}

/** Auto-fail unresolved trials, auto-check screen time, advance silence streak. */
async function settleDay(date: string, canCheckPresence: boolean): Promise<void> {
  const disciplines = await getActiveDisciplines();

  for (const discipline of disciplines) {
    if (discipline.code === 'SILENCE') continue;
    if (discipline.code === 'PRESENCE') continue; // resolved separately below

    const log = await getLog(discipline.id, date);
    if (log && (log.completed || log.failed)) continue;

    await failDiscipline(discipline.id, date);
  }

  await settlePresenceDiscipline(date, canCheckPresence);
  await incrementSilenceStreak(date);
}

/** Backwards-compatible single-day entry point (settles the given/last day). */
export async function runMidnightCheck(): Promise<void> {
  await runMissedMidnights();
}

/**
 * Resolve The Veil (PRESENCE) for a settled day. It behaves like any other
 * trial — it must end the day either completed or failed:
 *   - usage confirmed ≤ 30 min  → complete (award XP)
 *   - usage over the limit       → fail (deduct XP)
 *   - usage unknowable (no perms, or an older missed day UsageStats can't
 *     report) → fail, same as leaving any trial undone
 * A day the user already resolved by hand is left untouched.
 */
async function settlePresenceDiscipline(date: string, canCheckPresence: boolean): Promise<void> {
  const disciplines = await getActiveDisciplines();
  const presence = disciplines.find((d) => d.code === 'PRESENCE');
  if (!presence) return;

  const log = await getLog(presence.id, date);
  if (log && (log.completed || log.failed)) return;

  if (canCheckPresence) {
    // Score The Veil against the usage of the DAY being settled, not "today".
    const startOfDay = parseISO(date).getTime();
    const minutes = await UsageStatsModule.getScrollingTimeForDay(startOfDay);
    if (minutes >= 0 && minutes <= 30) {
      // Confirmed under the limit — the trial is passed.
      await completeDiscipline(presence.id, date);
      return;
    }
    // Over the limit, or permission denied (-1): fall through to fail.
  }

  await failDiscipline(presence.id, date);
}

async function incrementSilenceStreak(date: string): Promise<void> {
  const disciplines = await getActiveDisciplines();
  const silence = disciplines.find((d) => d.code === 'SILENCE');
  if (!silence) return;

  const log = await getLog(silence.id, date);
  if (log && log.failed) return;

  const streak = await getSilenceStreak();
  if (!streak) return;

  const newStreak = streak.current_streak + 1;
  const newLongest = Math.max(newStreak, streak.longest_streak);

  await updateSilenceStreak({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_success_date: date,
  });
}

async function checkWeeklyMilestone(): Promise<void> {
  const hero = await getHero();
  if (!hero) return;

  const startDate = parseISO(hero.journey_start_date);
  const now = new Date();
  const dayNumber = differenceInCalendarDays(now, startDate) + 1; // Day 1 = start day

  // The journey is a full 180 days — Final Judgement fires on Day 180.
  if (dayNumber >= 180 && !hero.journey_complete) {
    await checkFinalJudgement();
  }
}

async function checkFinalJudgement(): Promise<void> {
  const rate = await get180DayConsistencyRate();
  // Stash the rate so the Final Judgement screen can render the verdict, then
  // mark the journey complete (this also flags the screen to show once).
  await setSystemState('final_consistency_rate', String(Math.round(rate * 100)));
  await updateHero({ journey_complete: 1 });
}
