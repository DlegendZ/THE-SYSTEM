import { NativeModules, Platform } from 'react-native';

interface RichNotificationNative {
  schedule(id: number, title: string, body: string, fireAtMs: number, bigPic: string | null): Promise<boolean>;
  presentNow(title: string, body: string, bigPic: string | null): Promise<boolean>;
  cancelAll(): Promise<boolean>;
}

const native = NativeModules.RichNotificationModule as RichNotificationNative | undefined;
const available = Platform.OS === 'android' && !!native;

/**
 * Bridge to the native rich-notification module (large icon + avatar BigPicture
 * + actions). Falls back to no-ops when the native module isn't present.
 */
const RichNotification = {
  available,
  schedule(id: number, title: string, body: string, fireAtMs: number, bigPic?: string): Promise<boolean> {
    if (!available || !native) return Promise.resolve(false);
    return native.schedule(id, title, body, fireAtMs, bigPic ?? null);
  },
  presentNow(title: string, body: string, bigPic?: string): Promise<boolean> {
    if (!available || !native) return Promise.resolve(false);
    return native.presentNow(title, body, bigPic ?? null);
  },
  cancelAll(): Promise<boolean> {
    if (!available || !native) return Promise.resolve(false);
    return native.cancelAll();
  },
};

export default RichNotification;
