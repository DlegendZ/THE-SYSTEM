jest.mock('../../src/native/UsageStatsModule', () => ({
  __esModule: true,
  default: {
    getScrollingTimeToday: jest.fn().mockResolvedValue(-1),
    hasPermission: jest.fn().mockResolvedValue(false),
    openUsageAccessSettings: jest.fn(),
  },
}));

import { initDatabase, getDb } from '../../src/db/database';
import { runMissedMidnights } from '../../src/engine/midnightEngine';
import {
  getHero, createHero, getActiveDisciplines, getLog, setSystemState, getDisciplineByCode,
} from '../../src/db/queries';
import { completeDiscipline } from '../../src/engine/xpEngine';
import UsageStatsModule from '../../src/native/UsageStatsModule';
import { format, subDays } from 'date-fns';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

async function freshHero() {
  const db = getDb();
  await db.runAsync('DELETE FROM hero');
  await db.runAsync('DELETE FROM discipline_logs');
  await db.runAsync("DELETE FROM system_state WHERE key = 'last_midnight_date'");
  await createHero('Test', 'Warrior', fmt(subDays(new Date(), 3)));
}

beforeAll(async () => { await initDatabase(); });
beforeEach(async () => { await freshHero(); });

describe('settleDay auto-fails undone PRESENCE', () => {
  it('deducts PRESENCE xp_loss when left undone and no usage permission', async () => {
    // give the hero a balance so the deduction is observable above the 0 floor
    await getDb().runAsync('UPDATE hero SET global_xp = 500 WHERE id = 1');
    // marker = day before yesterday, so yesterday gets settled
    await setSystemState('last_midnight_date', fmt(subDays(new Date(), 2)));
    const presence = await getDisciplineByCode('PRESENCE');
    expect(presence).toBeTruthy();

    await runMissedMidnights();

    const yesterday = fmt(subDays(new Date(), 1));
    const log = await getLog(presence!.id, yesterday);
    expect(log).toBeTruthy();
    expect(log!.failed).toBe(1);
    expect(log!.xp_delta).toBe(-presence!.xp_loss);

    // settleDay auto-fails every undone trial (except SILENCE); total deduction
    // is the sum of their losses, and PRESENCE must be among them.
    const active = await getActiveDisciplines();
    const totalLoss = active
      .filter((d) => d.code !== 'SILENCE')
      .reduce((s, d) => s + d.xp_loss, 0);
    const after = (await getHero())!.global_xp;
    expect(after).toBe(Math.max(0, 500 - totalLoss));
    expect(totalLoss).toBeGreaterThanOrEqual(presence!.xp_loss);
  });
});

describe('settleDay auto-completes PRESENCE under the limit', () => {
  it('awards PRESENCE when usage is confirmed under 30 min', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(12);
    await setSystemState('last_midnight_date', fmt(subDays(new Date(), 2)));
    const presence = await getDisciplineByCode('PRESENCE');

    await runMissedMidnights();

    const yesterday = fmt(subDays(new Date(), 1));
    const log = await getLog(presence!.id, yesterday);
    expect(log).toBeTruthy();
    expect(log!.completed).toBe(1);
    expect(log!.xp_delta).toBeGreaterThan(0);
  });
});

describe('settleDay leaves already-resolved PRESENCE alone', () => {
  it('does not overwrite a PRESENCE log the user already completed', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(-1);
    const presence = await getDisciplineByCode('PRESENCE');
    const yesterday = fmt(subDays(new Date(), 1));
    await completeDiscipline(presence!.id, yesterday);
    await setSystemState('last_midnight_date', fmt(subDays(new Date(), 2)));

    await runMissedMidnights();

    const log = await getLog(presence!.id, yesterday);
    expect(log!.completed).toBe(1);
    expect(log!.failed).toBe(0);
  });
});
