import {
  getActiveDisciplines,
  getLog,
  getSilenceStreak,
  updateSilenceStreak,
  getHero,
} from '../db/queries';
import { failDiscipline } from './xpEngine';
import { format, subDays, parseISO, differenceInCalendarDays, getDay } from 'date-fns';
import UsageStatsModule from '../native/UsageStatsModule';

export async function runMidnightCheck(): Promise<void> {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const disciplines = await getActiveDisciplines();

  for (const discipline of disciplines) {
    if (discipline.code === 'SILENCE') continue;
    if (discipline.code === 'PRESENCE') continue;

    const log = await getLog(discipline.id, yesterday);
    if (log && (log.completed || log.failed)) continue;

    await failDiscipline(discipline.id, yesterday);
  }

  await checkPresenceDiscipline(yesterday);
  await incrementSilenceStreak(yesterday);

  const dayOfWeek = getDay(new Date());
  if (dayOfWeek === 1) {
    await checkWeeklyMilestone();
  }
}

async function checkPresenceDiscipline(date: string): Promise<void> {
  const disciplines = await getActiveDisciplines();
  const presence = disciplines.find((d) => d.code === 'PRESENCE');
  if (!presence) return;

  const log = await getLog(presence.id, date);
  if (log && (log.completed || log.failed)) return;

  // PRESENCE: auto-check via UsageStats (skip generic auto-fail)
  const minutesToday = await UsageStatsModule.getScrollingTimeToday();
  if (minutesToday >= 0 && minutesToday > 30) {
    // Over 30-min limit — auto-fail
    await failDiscipline(presence.id, date);
  }
  // If permission not granted (-1) or under limit, skip auto-fail
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
  const daysElapsed = differenceInCalendarDays(now, startDate);
  const weekNumber = Math.floor(daysElapsed / 7) + 1;

  if (weekNumber > 24) return;

  if (weekNumber === 25 && !hero.journey_complete) {
    await checkFinalJudgement();
  }
}

async function checkFinalJudgement(): Promise<void> {
  const { get180DayConsistencyRate, updateHero } = await import('../db/queries');
  const rate = await get180DayConsistencyRate();
  await updateHero({ journey_complete: 1 });
}
