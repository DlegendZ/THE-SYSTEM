import { initDatabase, getDb } from '../../src/db/database';
import { triggerRelapse } from '../../src/engine/xpEngine';
import {
  getHero, createHero, getAllLogs, getAllMandates, getCosmetics,
  getSilenceStreak, getSystemState, setSystemState, addCosmetic, createMandate, insertLog,
  getDisciplineByCode, updateSilenceStreak,
} from '../../src/db/queries';
import { format, addDays } from 'date-fns';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

beforeAll(async () => { await initDatabase(); });

describe('triggerRelapse — keep identity, soft reset', () => {
  it('zeroes progress, wipes history, keeps identity, records the relapse', async () => {
    const db = getDb();
    await db.runAsync('DELETE FROM hero');
    await db.runAsync('DELETE FROM discipline_logs');
    await db.runAsync('DELETE FROM mandates');
    await db.runAsync('DELETE FROM cosmetics');

    await createHero('The Architect', 'Mage', '2026-06-02');
    await db.runAsync("UPDATE hero SET global_xp = 345, global_level = 2, rank = 'E' WHERE id = 1");

    const today = fmt(new Date());

    // seed history + progress + streak record. FORGE done TODAY (should stay
    // locked-as-done); an older log that gets wiped.
    const forge = await getDisciplineByCode('FORGE');
    await insertLog(forge!.id, today, true, false, 60);
    await insertLog(forge!.id, '2026-06-02', true, false, 60);
    await createMandate('BRONZE');
    await addCosmetic('weapon', 2, 'Crimson Skin');
    await setSystemState('last_manual_mandate_date', '2026-06-01');
    await updateSilenceStreak({ current_streak: 4, longest_streak: 9, total_relapses: 1 });

    await triggerRelapse(today);

    // identity kept, progress zeroed, journey restarted
    const hero = await getHero();
    expect(hero?.name).toBe('The Architect');
    expect(hero?.hero_class).toBe('Mage');
    expect(hero?.global_xp).toBe(0);
    expect(hero?.global_level).toBe(1);
    expect(hero?.rank).toBe('E');
    // fresh journey starts TOMORROW — relapse day is the uncounted "Fallen" day
    expect(hero?.journey_start_date).toBe(fmt(addDays(new Date(), 1)));

    // Clean reset: all logs wiped (no leftover checkmarks).
    expect(await getAllLogs()).toHaveLength(0);
    expect(await getAllMandates()).toHaveLength(0);
    expect(await getCosmetics()).toHaveLength(0);

    // Trials locked for the rest of today via the flag.
    expect(await getSystemState('relapse_lock_date')).toBe(today);
    // Settler anchored at today so the relapse day isn't auto-failed.
    expect(await getSystemState('last_midnight_date')).toBe(today);
    // Petition cooldown cleared → can petition again on the fresh start.
    expect(await getSystemState('last_manual_mandate_date')).toBeNull();

    // silence streak: current reset, longest kept, relapse counted
    const streak = await getSilenceStreak();
    expect(streak?.current_streak).toBe(0);
    expect(streak?.longest_streak).toBe(9);
    expect(streak?.total_relapses).toBe(2);
    expect(streak?.last_relapse_date).toBe(today);
  });
});
