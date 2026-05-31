import * as Notifications from 'expo-notifications';
import { CHANNEL_ID, CATEGORY_ID } from './setup';
import RichNotification from '../native/RichNotification';
import type { Rank, HeroClass } from '../types';

const NOTIFICATION_POOL: Record<string, string[]> = {
  SILENCE: [
    'Day {streak}. Your streak is your sword. Do not drop it.',
    'The war against weakness is won one day at a time. Today is that day.',
    'Every man who built something great fought this same war. Win it.',
    'The urge is a test. You have passed it before. Pass it again.',
    'Day {streak} of the Silence Protocol. The System is watching.',
  ],
  FORGE: [
    'The Iron Temple awaits. Your muscles do not grow in this chair.',
    'The bar does not care how you feel. Neither does your future self.',
    'You paid for that gym membership. Go collect what is yours.',
    'Soreness is your armor being forged. Embrace it.',
    'Your body is being recast. The furnace is today\'s session.',
  ],
  HEALTH: [
    '23:00 approaches. Night Silence begins. Prepare.',
    '08:30. The System is watching. Rise.',
    'Screen time is the invisible thief. Check your Veil discipline.',
    'The Scroll has not been opened today. Knowledge is power.',
    'Clean fuel only. Your body is your weapon.',
  ],
  GENERAL: [
    'You were selected because something in you is capable of greatness. Prove the System right.',
    '6 months from now you will wish you started today harder.',
    'No one is coming to save you. That is the good news.',
    'The forge does not stop. Neither do you.',
    '180 days. That is all it takes to become unrecognizable.',
    'Discipline is choosing what you want most over what you want now.',
    'The System does not reward the almost-disciplined.',
    'Level {level}. Rank {rank}. The ascension continues.',
  ],
  MILESTONE: [
    '{streak}-day streak. The System registers your resolve.',
    '30 days of silence. The System is impressed. Do not stop here.',
    'Rank {rank} achieved. The world below you is getting smaller.',
  ],
};

interface NotificationContext {
  streak?: number;
  level?: number;
  rank?: Rank;
  heroClass?: HeroClass;
}

/** Drawable name of the pre-rendered avatar banner for this class+rank. */
function avatarBanner(ctx: NotificationContext): string | undefined {
  if (!ctx.heroClass) return undefined;
  return `notif_${ctx.heroClass.toLowerCase()}_${(ctx.rank ?? 'E').toLowerCase()}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCategory(): string {
  const categories = ['SILENCE', 'FORGE', 'HEALTH', 'GENERAL'];
  return pickRandom(categories);
}

function fillTemplate(message: string, ctx: NotificationContext): string {
  return message
    .replace(/{streak}/g, String(ctx.streak ?? 0))
    .replace(/{level}/g, String(ctx.level ?? 1))
    .replace(/{rank}/g, ctx.rank ?? 'E');
}

export async function scheduleNotifications(
  intervalHours: number,
  quietStart: number,
  quietEnd: number,
  ctx: NotificationContext
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await RichNotification.cancelAll();

  const now = new Date();
  const hoursToSchedule = 48;
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
    const category = pickCategory();
    const pool = NOTIFICATION_POOL[category];
    const message = fillTemplate(pickRandom(pool), ctx).toUpperCase();

    if (RichNotification.available) {
      // Native: large app icon + avatar BigPicture banner + action buttons.
      await RichNotification.schedule(id++, 'THE SYSTEM', message, slot.getTime(), banner);
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'THE SYSTEM',
          body: message,
          color: '#3bc9ff',
          categoryIdentifier: CATEGORY_ID,
          data: { type: category },
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
