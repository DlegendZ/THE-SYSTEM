import { initDatabase } from '../../src/db/database';
import {
  getLogsForRange,
  getAllMandates,
  setDisciplineActive,
  createCustomDiscipline,
  deleteDiscipline,
  getAllDisciplines,
  getDiscipline,
} from '../../src/db/queries';

beforeAll(async () => {
  await initDatabase();
});

describe('getLogsForRange', () => {
  it('returns empty array when no logs in range', async () => {
    const logs = await getLogsForRange('2030-01-01', '2030-01-07');
    expect(logs).toEqual([]);
  });
});

describe('getAllMandates', () => {
  it('returns array', async () => {
    const mandates = await getAllMandates();
    expect(Array.isArray(mandates)).toBe(true);
  });
});

describe('setDisciplineActive + createCustomDiscipline + deleteDiscipline', () => {
  it('toggles discipline active state', async () => {
    const before = await getAllDisciplines();
    const rise = before.find(d => d.code === 'RISE');
    expect(rise).toBeDefined();
    await setDisciplineActive(rise!.id, false);
    const after = await getDiscipline(rise!.id);
    expect(after?.is_active).toBe(0);
    // restore
    await setDisciplineActive(rise!.id, true);
  });

  it('creates and deletes a custom discipline', async () => {
    await createCustomDiscipline({
      name: 'Test Habit',
      description: 'Test description',
      difficulty: 'EASY',
      xpGain: 10,
      xpLoss: 5,
      deadlineTime: '23:59',
    });
    const all = await getAllDisciplines();
    const custom = all.find(d => d.name === 'Test Habit');
    expect(custom).toBeDefined();
    await deleteDiscipline(custom!.id);
    const allAfter = await getAllDisciplines();
    expect(allAfter.find(d => d.name === 'Test Habit')).toBeUndefined();
  });
});
