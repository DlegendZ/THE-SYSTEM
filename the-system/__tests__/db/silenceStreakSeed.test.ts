import { initDatabase, getDb } from '../../src/db/database';
import { createHero, getSilenceStreak } from '../../src/db/queries';

beforeAll(async () => { await initDatabase(); });

describe('createHero seeds the silence streak row', () => {
  it('leaves a usable streak row even after a reset wiped it', async () => {
    // simulate resetJourney() having deleted the migration-seeded row
    await getDb().runAsync('DELETE FROM silence_streak');
    expect(await getSilenceStreak()).toBeNull();

    await createHero('Reborn', 'Warrior', '2026-06-02');

    const streak = await getSilenceStreak();
    expect(streak).not.toBeNull();
    expect(streak?.current_streak).toBe(0);
    expect(streak?.total_relapses).toBe(0);
  });

  it('does not clobber an existing streak row', async () => {
    await getDb().runAsync(
      'INSERT OR REPLACE INTO silence_streak (id, current_streak, longest_streak, total_relapses) VALUES (1, 7, 9, 2)'
    );
    await createHero('Again', 'Mage', '2026-06-02');
    const streak = await getSilenceStreak();
    expect(streak?.current_streak).toBe(7); // preserved, not reset to 0
  });
});
