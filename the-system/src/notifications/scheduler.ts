import * as Notifications from 'expo-notifications';
import { CHANNEL_ID, CATEGORY_ID } from './setup';
import RichNotification from '../native/RichNotification';
import type { Rank, HeroClass } from '../types';

// Short flavor lines appended after the undone-trials count. Sentence case;
// {streak}/{day} are filled from the live context.
const FLAVORS: string[] = [
  'The System is watching.',
  'Day {day}. Claim it.',
  'Streak {streak} — hold the line.',
  'The forge does not wait.',
  'Discipline now, or regret later.',
  'No one is coming. Good — that power is yours.',
  'Rank up the habits and the title follows.',
];

interface NotificationContext {
  streak?: number;
  level?: number;
  rank?: Rank;
  heroClass?: HeroClass;
  /** Total active daily disciplines. */
  total?: number;
  /** Active disciplines not yet completed or failed today. */
  undone?: number;
  /** Journey day number (1-based). */
  day?: number;
}

/** Drawable name of the pre-rendered avatar banner for this class+rank. */
function avatarBanner(ctx: NotificationContext): string | undefined {
  if (!ctx.heroClass) return undefined;
  return `notif_${ctx.heroClass.toLowerCase()}_${(ctx.rank ?? 'E').toLowerCase()}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(message: string, ctx: NotificationContext): string {
  return message
    .replace(/{streak}/g, String(ctx.streak ?? 0))
    .replace(/{level}/g, String(ctx.level ?? 1))
    .replace(/{rank}/g, ctx.rank ?? 'E')
    .replace(/{day}/g, String(ctx.day ?? 1));
}

/** "{undone} of {total} trials still undone. {flavor}" */
function progressMessage(undone: number, total: number, ctx: NotificationContext): string {
  const noun = undone === 1 ? 'trial' : 'trials';
  const flavor = fillTemplate(pickRandom(FLAVORS), ctx);
  return `${undone} of ${total} ${noun} still undone. ${flavor}`;
}

/** Message for slots on a future day — no logs yet, so every trial is open. */
function futureDayMessage(total: number, ctx: NotificationContext): string {
  const flavor = fillTemplate(pickRandom(FLAVORS), ctx);
  return `${total} trials await — a new day under the System. ${flavor}`;
}

export async function scheduleNotifications(
  intervalHours: number,
  quietStart: number,
  quietEnd: number,
  ctx: NotificationContext
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await RichNotification.cancelAll();

  const total = ctx.total ?? 0;
  const undoneToday = ctx.undone ?? 0;
  // Nothing tracked yet (no disciplines) — schedule nothing.
  if (total === 0) return;

  const now = new Date();
  // Schedule a week ahead so reminders keep firing between app opens; a full
  // refill runs on every app open and on every completion/relapse.
  const hoursToSchedule = 168;
  const slots: Date[] = [];

  // Start at the first whole interval in the future (skip h=0 = now).
  for (let h = intervalHours; h < hoursToSchedule; h += intervalHours) {
    const slot = new Date(now.getTime() + h * 60 * 60 * 1000);
    const hour = slot.getHours();
    if (hour >= quietStart && hour < quietEnd && quietStart < quietEnd) continue;
    if (quietStart > quietEnd && (hour >= quietStart || hour < quietEnd)) continue;
    slots.push(slot);
  }

  const banner = avatarBanner(ctx);
  let id = 1;

  for (const slot of slots) {
    const isToday = slot.toDateString() === now.toDateString();
    let message: string;
    if (isToday) {
      // All of today's trials are resolved → stay silent for the rest of today.
      if (undoneToday === 0) continue;
      message = progressMessage(undoneToday, total, ctx);
    } else {
      // Future day: re-baked when the app is next opened that day.
      message = futureDayMessage(total, ctx);
    }

    if (RichNotification.available) {
      // Native: large round avatar + action buttons.
      await RichNotification.schedule(id++, 'THE SYSTEM', message, slot.getTime(), banner);
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'THE SYSTEM',
          body: message,
          color: '#3bc9ff',
          categoryIdentifier: CATEGORY_ID,
          data: { type: 'progress' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: slot,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
