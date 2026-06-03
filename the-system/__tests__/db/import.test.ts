import { initDatabase, getDb } from '../../src/db/database';
import {
  importData, validateImport, getHero, getAllDisciplines, getAllLogs,
  getSystemState, getSilenceStreak, type ExportBundle,
} from '../../src/db/queries';

beforeAll(async () => { await initDatabase(); });

describe('validateImport', () => {
  it('rejects non-objects', () => {
    expect(validateImport(null).ok).toBe(false);
    expect(validateImport('x').ok).toBe(false);
  });
  it('rejects bundles missing hero/disciplines/logs', () => {
    expect(validateImport({}).ok).toBe(false);
    expect(validateImport({ hero: [], disciplines: [], logs: [] }).ok).toBe(false); // empty hero
    expect(validateImport({ hero: [{ id: 1 }], disciplines: [] }).ok).toBe(false); // no logs
  });
  it('accepts a well-formed bundle', () => {
    expect(validateImport({ hero: [{ id: 1 }], disciplines: [], logs: [] }).ok).toBe(true);
  });
});

describe('importData', () => {
  it('replaces all local data with the bundle', async () => {
    const bundle: ExportBundle = {
      version: 1,
      hero: [{
        id: 1, name: 'Imported', hero_class: 'Mage', global_xp: 185,
        global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
      }],
      disciplines: [{
        id: 1, code: 'FORGE', name: 'Iron', description: 'd', difficulty: 'HARD',
        xp_gain: 60, xp_loss: 35, deadline_time: null, is_active: 1, is_custom: 0,
        frequency: 'daily', active_days: null, created_at: '2026-01-01T00:00:00Z',
      }],
      logs: [{
        id: 1, discipline_id: 1, log_date: '2026-01-02', completed: 1, failed: 0,
        xp_delta: 60, notes: null, logged_at: '2026-01-02T10:00:00Z',
      }],
      silenceStreak: [{
        id: 1, current_streak: 5, longest_streak: 9, last_success_date: '2026-01-02',
        total_relapses: 1, last_relapse_date: null,
      }],
      mandates: [],
      cosmetics: [],
      systemState: [{ key: 'onboarding_complete', value: '1' }],
    };

    await importData(bundle);

    const hero = await getHero();
    expect(hero?.name).toBe('Imported');
    expect(hero?.global_xp).toBe(185);

    const disciplines = await getAllDisciplines();
    expect(disciplines).toHaveLength(1);
    expect(disciplines[0].code).toBe('FORGE');

    const logs = await getAllLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].xp_delta).toBe(60);

    const streak = await getSilenceStreak();
    expect(streak?.current_streak).toBe(5);

    expect(await getSystemState('onboarding_complete')).toBe('1');
  });

  it('rolls back on a malformed row, leaving prior data intact', async () => {
    // seed a known-good state
    await importData({
      hero: [{ id: 1, name: 'Keep', hero_class: 'Warrior', global_xp: 10, global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0 }],
      disciplines: [],
      logs: [],
    });

    const bad: ExportBundle = {
      hero: [{ id: 1, name: 'Bad', hero_class: 'Warrior', global_xp: 0, global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0 }],
      disciplines: [],
      // log references a nonexistent column → INSERT throws → transaction rolls back
      logs: [{ not_a_real_column: 1 }],
    };

    await expect(importData(bad)).rejects.toBeDefined();

    const hero = await getHero();
    expect(hero?.name).toBe('Keep');
  });
});
