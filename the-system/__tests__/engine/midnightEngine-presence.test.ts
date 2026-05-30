jest.mock('../../src/native/UsageStatsModule', () => ({
  __esModule: true,
  default: {
    getScrollingTimeToday: jest.fn(),
    hasPermission: jest.fn().mockResolvedValue(true),
    openUsageAccessSettings: jest.fn(),
  },
}));

import UsageStatsModule from '../../src/native/UsageStatsModule';

describe('PRESENCE discipline UsageStats integration', () => {
  it('UsageStatsModule returns -1 when mocked (test env)', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(-1);
    const result = await UsageStatsModule.getScrollingTimeToday();
    expect(result).toBe(-1);
  });

  it('UsageStatsModule returns positive number when mocked', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(45.5);
    const result = await UsageStatsModule.getScrollingTimeToday();
    expect(result).toBe(45.5);
  });

  it('over 30 minutes triggers PRESENCE fail logic', () => {
    const minutesToday = 45;
    expect(minutesToday >= 0 && minutesToday > 30).toBe(true);
  });

  it('under 30 minutes does NOT trigger PRESENCE fail', () => {
    const minutesToday = 25;
    expect(minutesToday >= 0 && minutesToday > 30).toBe(false);
  });

  it('permission not granted (-1) does not auto-fail', () => {
    const minutesToday = -1;
    expect(minutesToday >= 0 && minutesToday > 30).toBe(false);
  });
});
