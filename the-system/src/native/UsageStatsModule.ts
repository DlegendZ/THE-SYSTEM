import { NativeModules, Platform } from 'react-native';

interface UsageStatsModuleInterface {
  /** Returns total minutes in tracked apps today. -1 if permission not granted. */
  getScrollingTimeToday(): Promise<number>;
  /** Minutes in tracked apps for the calendar day starting at the given epoch ms.
   *  -1 if permission not granted / no data. */
  getScrollingTimeForDay(startOfDayMillis: number): Promise<number>;
  hasPermission(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
}

const { UsageStatsModule } = NativeModules;

const UsageStatsModuleBridge: UsageStatsModuleInterface = Platform.OS === 'android' && UsageStatsModule
  ? UsageStatsModule
  : {
      getScrollingTimeToday: () => Promise.resolve(-1),
      getScrollingTimeForDay: () => Promise.resolve(-1),
      hasPermission: () => Promise.resolve(false),
      openUsageAccessSettings: () => Promise.reject(new Error('UsageStatsModule not available')),
    };

export default UsageStatsModuleBridge;
