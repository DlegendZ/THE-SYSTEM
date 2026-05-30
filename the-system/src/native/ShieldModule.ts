import { NativeModules, Platform } from 'react-native';

interface ShieldModuleInterface {
  lockNow(): Promise<boolean>;
  isAdminActive(): Promise<boolean>;
  openAdminSettings(): Promise<boolean>;
}

const { ShieldModule } = NativeModules;

const ShieldModuleBridge: ShieldModuleInterface = Platform.OS === 'android' && ShieldModule
  ? ShieldModule
  : {
      lockNow: () => Promise.reject(new Error('ShieldModule not available')),
      isAdminActive: () => Promise.resolve(false),
      openAdminSettings: () => Promise.reject(new Error('ShieldModule not available')),
    };

export default ShieldModuleBridge;
