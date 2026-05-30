import UsageStatsModule from '../../src/native/UsageStatsModule';

describe('UsageStatsModule (JS bridge)', () => {
  it('getScrollingTimeToday returns -1 in test env (no native)', async () => {
    const result = await UsageStatsModule.getScrollingTimeToday();
    expect(result).toBe(-1);
  });

  it('hasPermission returns false in test env', async () => {
    const result = await UsageStatsModule.hasPermission();
    expect(result).toBe(false);
  });
});
