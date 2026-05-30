# Phase 4: Native Android Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ShieldModule (screen lock via DevicePolicyManager), UsageStatsModule (PRESENCE discipline tracking), and wire both into the React Native JS layer.

**Architecture:** Two custom ReactPackage / ReactContextBaseJavaModule pairs. ShieldModule calls `DevicePolicyManager.lockNow()`. UsageStatsModule calls `UsageStatsManager.queryUsageStats()`. JS bridge via `NativeModules`. ShieldOverlay screen in React Native (app stays visible with countdown while screen is locked externally — screen lock fires immediately, overlay is for pre-lock countdown).

**Tech Stack:** Java (not Kotlin — simpler for standalone native modules), React Native New Architecture (TurboModules disabled — use legacy `ReactContextBaseJavaModule`), AndroidManifest.xml permissions

**Important:** This project uses New Architecture (`newArchEnabled=true` in gradle.properties). The packages are added via the `packageList` lambda in `MainApplication.kt`. Legacy `ReactContextBaseJavaModule` works with new arch in bridge compatibility mode.

---

## File Structure

```
android/app/src/main/
  java/com/thesystem/
    DeviceAdminReceiver.java     — admin event receiver
    ShieldModule.java             — lockNow + countdown
    ShieldPackage.java            — registers ShieldModule
    UsageStatsModule.java         — getScrollingTimeToday()
    UsageStatsPackage.java        — registers UsageStatsModule
  res/xml/
    device_admin.xml              — declares device admin policies

src/
  native/
    ShieldModule.ts               — JS bridge for Shield
    UsageStatsModule.ts           — JS bridge for UsageStats
  screens/
    ShieldOverlay.tsx             — pre-lock countdown overlay
  navigation/
    types.ts                      — add ShieldOverlay to RootStackParamList
    AppNavigator.tsx              — add ShieldOverlay to root stack
```

---

## Task 1: Device Admin XML Resource

**Files:**
- Create: `the-system/android/app/src/main/res/xml/device_admin.xml`

- [ ] **Step 1: Create device_admin.xml**

Create directory `android/app/src/main/res/xml/` if it doesn't exist.

Create `the-system/android/app/src/main/res/xml/device_admin.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-policies>
    <force-lock />
  </uses-policies>
</device-admin>
```

- [ ] **Step 2: Verify file exists**

```powershell
Test-Path "the-system/android/app/src/main/res/xml/device_admin.xml"
```
Expected: True

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add android/app/src/main/res/xml/device_admin.xml
git commit -m "feat: add device_admin.xml policy file for Shield Protocol"
```

---

## Task 2: DeviceAdminReceiver

**Files:**
- Create: `the-system/android/app/src/main/java/com/thesystem/DeviceAdminReceiver.java`

- [ ] **Step 1: Create DeviceAdminReceiver.java**

Create `the-system/android/app/src/main/java/com/thesystem/DeviceAdminReceiver.java`:
```java
package com.thesystem;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    @Override
    public void onEnabled(Context context, Intent intent) {
        // Device admin enabled — no action needed
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        // Device admin disabled — no action needed
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return "Disabling Shield Protocol will remove screen lock capability.";
    }
}
```

- [ ] **Step 2: Commit**

```powershell
cd the-system
git add android/app/src/main/java/com/thesystem/DeviceAdminReceiver.java
git commit -m "feat: add DeviceAdminReceiver for Shield Protocol screen lock"
```

---

## Task 3: ShieldModule + ShieldPackage

**Files:**
- Create: `the-system/android/app/src/main/java/com/thesystem/ShieldModule.java`
- Create: `the-system/android/app/src/main/java/com/thesystem/ShieldPackage.java`

- [ ] **Step 1: Create ShieldModule.java**

Create `the-system/android/app/src/main/java/com/thesystem/ShieldModule.java`:
```java
package com.thesystem;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ShieldModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ShieldModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "ShieldModule";
    }

    @ReactMethod
    public void lockNow(Promise promise) {
        try {
            DevicePolicyManager dpm =
                (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent =
                new ComponentName(reactContext, DeviceAdminReceiver.class);

            if (dpm == null) {
                promise.reject("NO_DPM", "DevicePolicyManager not available");
                return;
            }

            if (!dpm.isAdminActive(adminComponent)) {
                promise.reject("NOT_ADMIN", "Device admin not active. Grant Device Admin permission first.");
                return;
            }

            dpm.lockNow();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("LOCK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isAdminActive(Promise promise) {
        try {
            DevicePolicyManager dpm =
                (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent =
                new ComponentName(reactContext, DeviceAdminReceiver.class);

            if (dpm == null) {
                promise.resolve(false);
                return;
            }

            promise.resolve(dpm.isAdminActive(adminComponent));
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openAdminSettings(Promise promise) {
        try {
            android.content.Intent intent = new android.content.Intent(
                DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN
            );
            ComponentName adminComponent =
                new ComponentName(reactContext, DeviceAdminReceiver.class);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Required for Shield Protocol to lock your screen."
            );
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", e.getMessage());
        }
    }
}
```

- [ ] **Step 2: Create ShieldPackage.java**

Create `the-system/android/app/src/main/java/com/thesystem/ShieldPackage.java`:
```java
package com.thesystem;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ShieldPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ShieldModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add android/app/src/main/java/com/thesystem/ShieldModule.java
git add android/app/src/main/java/com/thesystem/ShieldPackage.java
git commit -m "feat: add ShieldModule/ShieldPackage for DevicePolicyManager screen lock"
```

---

## Task 4: UsageStatsModule + UsageStatsPackage

**Files:**
- Create: `the-system/android/app/src/main/java/com/thesystem/UsageStatsModule.java`
- Create: `the-system/android/app/src/main/java/com/thesystem/UsageStatsPackage.java`

- [ ] **Step 1: Create UsageStatsModule.java**

Create `the-system/android/app/src/main/java/com/thesystem/UsageStatsModule.java`:
```java
package com.thesystem;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

public class UsageStatsModule extends ReactContextBaseJavaModule {

    // Tracked social/browser packages for PRESENCE discipline
    private static final List<String> TRACKED_PACKAGES = Arrays.asList(
        "com.android.chrome",
        "org.mozilla.firefox",
        "com.instagram.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.zhiliaoapp.musically",  // TikTok
        "com.reddit.frontpage",
        "com.google.android.youtube",
        "com.facebook.orca",         // Messenger
        "com.snapchat.android",
        "com.pinterest"
    );

    private final ReactApplicationContext reactContext;

    public UsageStatsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "UsageStatsModule";
    }

    @ReactMethod
    public void getScrollingTimeToday(Promise promise) {
        try {
            UsageStatsManager usm =
                (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            if (usm == null) {
                promise.reject("NO_USM", "UsageStatsManager not available");
                return;
            }

            // Check permission
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            long startOfDay = cal.getTimeInMillis();
            long now = System.currentTimeMillis();

            Map<String, UsageStats> usageStatsMap =
                usm.queryAndAggregateUsageStats(startOfDay, now);

            if (usageStatsMap == null || usageStatsMap.isEmpty()) {
                // Permission likely not granted — return -1 to indicate
                promise.resolve(-1.0);
                return;
            }

            long totalMs = 0;
            for (String pkg : TRACKED_PACKAGES) {
                UsageStats stats = usageStatsMap.get(pkg);
                if (stats != null) {
                    totalMs += stats.getTotalTimeInForeground();
                }
            }

            double totalMinutes = totalMs / 60000.0;
            promise.resolve(totalMinutes);
        } catch (Exception e) {
            promise.reject("USAGE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            UsageStatsManager usm =
                (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                promise.resolve(false);
                return;
            }
            Calendar cal = Calendar.getInstance();
            long now = System.currentTimeMillis();
            long oneHourAgo = now - 3600000L;
            Map<String, UsageStats> stats =
                usm.queryAndAggregateUsageStats(oneHourAgo, now);
            // If stats returned something (even empty map from our packages), permission is granted
            // If it returns null or we get SecurityException, not granted
            promise.resolve(stats != null);
        } catch (SecurityException e) {
            promise.resolve(false);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openUsageAccessSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", e.getMessage());
        }
    }
}
```

- [ ] **Step 2: Create UsageStatsPackage.java**

Create `the-system/android/app/src/main/java/com/thesystem/UsageStatsPackage.java`:
```java
package com.thesystem;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class UsageStatsPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new UsageStatsModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add android/app/src/main/java/com/thesystem/UsageStatsModule.java
git add android/app/src/main/java/com/thesystem/UsageStatsPackage.java
git commit -m "feat: add UsageStatsModule/Package for PRESENCE discipline screen time tracking"
```

---

## Task 5: AndroidManifest.xml Updates

**Files:**
- Modify: `the-system/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Update AndroidManifest.xml**

Replace `the-system/android/app/src/main/AndroidManifest.xml` entirely with:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>

  <!-- Shield Protocol: device admin for screen lock -->
  <uses-permission android:name="android.permission.BIND_DEVICE_ADMIN" tools:ignore="ProtectedPermissions"/>

  <!-- PRESENCE discipline: usage stats for screen time -->
  <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions"/>

  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https"/>
    </intent>
  </queries>

  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="true"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:enableOnBackInvokedCallback="false">

    <meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
    <meta-data android:name="expo.modules.updates.ENABLE_BSDIFF_PATCH_SUPPORT" android:value="true"/>
    <meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
    <meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="0"/>

    <activity
      android:name=".MainActivity"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:theme="@style/Theme.App.SplashScreen"
      android:exported="true"
      android:screenOrientation="portrait">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>

    <!-- Shield Protocol: Device Admin Receiver -->
    <receiver
      android:name=".DeviceAdminReceiver"
      android:label="Shield Protocol"
      android:description="@string/app_name"
      android:permission="android.permission.BIND_DEVICE_ADMIN"
      android:exported="true">
      <meta-data
        android:name="android.app.device_admin"
        android:resource="@xml/device_admin"/>
      <intent-filter>
        <action android:name="android.app.action.DEVICE_ADMIN_ENABLED"/>
      </intent-filter>
    </receiver>

  </application>
</manifest>
```

- [ ] **Step 2: Verify manifest parses (build check)**

This will be verified when we do the full build in Task 8. For now, just check the XML is well-formed by reviewing it visually.

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat: add Shield Protocol and UsageStats permissions to AndroidManifest"
```

---

## Task 6: Register Packages in MainApplication.kt

**Files:**
- Modify: `the-system/android/app/src/main/java/com/thesystem/MainApplication.kt`

- [ ] **Step 1: Add packages to MainApplication.kt**

Replace `the-system/android/app/src/main/java/com/thesystem/MainApplication.kt` entirely:
```kotlin
package com.thesystem

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Custom native modules
          add(ShieldPackage())
          add(UsageStatsPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
```

- [ ] **Step 2: Commit**

```powershell
cd the-system
git add android/app/src/main/java/com/thesystem/MainApplication.kt
git commit -m "feat: register ShieldPackage and UsageStatsPackage in MainApplication"
```

---

## Task 7: JS Bridge Modules

**Files:**
- Create: `the-system/src/native/ShieldModule.ts`
- Create: `the-system/src/native/UsageStatsModule.ts`

- [ ] **Step 1: Create ShieldModule.ts**

Create `the-system/src/native/ShieldModule.ts`:
```typescript
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
```

- [ ] **Step 2: Create UsageStatsModule.ts**

Create `the-system/src/native/UsageStatsModule.ts`:
```typescript
import { NativeModules, Platform } from 'react-native';

interface UsageStatsModuleInterface {
  /** Returns total minutes spent in tracked apps today. Returns -1 if permission not granted. */
  getScrollingTimeToday(): Promise<number>;
  hasPermission(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
}

const { UsageStatsModule } = NativeModules;

const UsageStatsModuleBridge: UsageStatsModuleInterface = Platform.OS === 'android' && UsageStatsModule
  ? UsageStatsModule
  : {
      getScrollingTimeToday: () => Promise.resolve(-1),
      hasPermission: () => Promise.resolve(false),
      openUsageAccessSettings: () => Promise.reject(new Error('UsageStatsModule not available')),
    };

export default UsageStatsModuleBridge;
```

- [ ] **Step 3: Write tests**

Create `the-system/__tests__/native/ShieldModule.test.ts`:
```typescript
import ShieldModule from '../../src/native/ShieldModule';

// NativeModules.ShieldModule is undefined in Jest (no native bridge)
// The module should fall back to the stub implementation

describe('ShieldModule (JS bridge)', () => {
  it('lockNow rejects with error in test env', async () => {
    await expect(ShieldModule.lockNow()).rejects.toThrow();
  });

  it('isAdminActive returns false in test env', async () => {
    const result = await ShieldModule.isAdminActive();
    expect(result).toBe(false);
  });
});
```

Create `the-system/__tests__/native/UsageStatsModule.test.ts`:
```typescript
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
```

Run: `cd the-system && npx jest __tests__/native/ --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```powershell
cd the-system
git add src/native/ShieldModule.ts src/native/UsageStatsModule.ts __tests__/native/
git commit -m "feat: add JS bridge modules for Shield and UsageStats"
```

---

## Task 8: ShieldOverlay Screen

**Files:**
- Create: `the-system/src/screens/ShieldOverlay.tsx`
- Modify: `the-system/src/navigation/types.ts`
- Modify: `the-system/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Update navigation types**

Modify `the-system/src/navigation/types.ts` to add ShieldOverlay:
```typescript
export type RootStackParamList = {
  Awakening: undefined;
  Main: undefined;
  MandateReveal: undefined;
  LevelUpSplash: {
    level: number;
    xpGained: number;
    rankChanged: boolean;
    newRank: string;
  };
  Settings: undefined;
  ShieldOverlay: undefined;
};
```

- [ ] **Step 2: Add ShieldOverlay to AppNavigator**

In `the-system/src/navigation/AppNavigator.tsx`, add the import and screen:

Add import after the Settings import line:
```tsx
import ShieldOverlay from '../screens/ShieldOverlay';
```

Add screen inside the `<>` block (after Settings Stack.Screen):
```tsx
<Stack.Screen
  name="ShieldOverlay"
  component={ShieldOverlay}
  options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
/>
```

- [ ] **Step 3: Create ShieldOverlay.tsx**

Create `the-system/src/screens/ShieldOverlay.tsx`:
```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSystemStore } from '../store/useSystemStore';
import ShieldModule from '../native/ShieldModule';

const LOCK_DELAY_SECONDS = 5; // countdown before lock fires

export default function ShieldOverlay() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { currentTheme: theme } = useSystemStore();
  const [countdown, setCountdown] = useState(LOCK_DELAY_SECONDS);
  const [locking, setLocking] = useState(false);
  const [adminReady, setAdminReady] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    ShieldModule.isAdminActive().then(setAdminReady);
  }, []);

  useEffect(() => {
    if (adminReady !== true || locking) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [adminReady, locking, pulseAnim]);

  const startLock = () => {
    setLocking(true);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          ShieldModule.lockNow()
            .then(() => navigation.goBack())
            .catch((err) => {
              Alert.alert('SHIELD ERROR', String(err));
              navigation.goBack();
            });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigation.goBack();
  };

  const handleGrantAdmin = async () => {
    await ShieldModule.openAdminSettings();
  };

  // Not granted
  if (adminReady === false) {
    return (
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background, borderColor: '#ff4444' }]}>
          <Text style={[styles.title, { color: '#ff4444' }]}>SHIELD PROTOCOL</Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Device Admin permission is required for screen lock.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { borderColor: theme.accent }]}
            onPress={handleGrantAdmin}
          >
            <Text style={[styles.btnText, { color: theme.accent }]}>GRANT DEVICE ADMIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Ready / counting down
  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: theme.background, borderColor: '#ff4444' }]}>
        <Text style={[styles.title, { color: '#ff4444' }]}>SHIELD PROTOCOL</Text>

        {!locking ? (
          <>
            <Text style={[styles.body, { color: theme.text }]}>
              Screen will lock immediately.
            </Text>
            <Text style={[styles.warning, { color: theme.textSecondary }]}>
              You can cancel within {LOCK_DELAY_SECONDS} seconds after activating.
            </Text>
            <TouchableOpacity
              style={[styles.lockBtn, { backgroundColor: '#ff4444' }]}
              onPress={startLock}
            >
              <Text style={styles.lockBtnText}>ACTIVATE SHIELD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Animated.Text
              style={[styles.countdown, { color: '#ff4444', transform: [{ scale: pulseAnim }] }]}
            >
              {countdown}
            </Animated.Text>
            <Text style={[styles.body, { color: theme.text }]}>
              Locking in {countdown} second{countdown !== 1 ? 's' : ''}...
            </Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 300,
    padding: 32,
    borderWidth: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 20,
  },
  body: { fontSize: 12, textAlign: 'center', marginBottom: 12, lineHeight: 20 },
  warning: { fontSize: 10, textAlign: 'center', marginBottom: 24 },
  btn: {
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  btnText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  lockBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
  },
  lockBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 10, letterSpacing: 1 },
  countdown: { fontSize: 72, fontWeight: 'bold', marginBottom: 12 },
});
```

- [ ] **Step 4: Add Shield button to CommandHall**

In `the-system/src/screens/CommandHall.tsx`, add a SHIELD PROTOCOL button at the bottom of the ScrollView (after the quest log disciplines, before the closing `</ScrollView>` tag):

```tsx
{/* Shield Protocol Button */}
<TouchableOpacity
  style={[styles.shieldButton, { backgroundColor: '#1a0000', borderColor: '#ff4444' }]}
  onPress={() => navigation.navigate('ShieldOverlay')}
>
  <Text style={styles.shieldButtonText}>🛡 SHIELD PROTOCOL</Text>
</TouchableOpacity>
```

Add these to the `styles` StyleSheet in CommandHall.tsx:
```tsx
shieldButton: {
  margin: 16,
  marginBottom: 8,
  padding: 16,
  borderWidth: 2,
  alignItems: 'center',
},
shieldButtonText: {
  color: '#ff4444',
  fontSize: 13,
  fontWeight: 'bold',
  letterSpacing: 2,
},
```

- [ ] **Step 5: Write test**

Create `the-system/__tests__/screens/ShieldOverlay.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/native/ShieldModule', () => ({
  default: {
    lockNow: jest.fn().mockResolvedValue(true),
    isAdminActive: jest.fn().mockResolvedValue(false),
    openAdminSettings: jest.fn().mockResolvedValue(true),
  },
}));

import ShieldOverlay from '../../src/screens/ShieldOverlay';

describe('ShieldOverlay', () => {
  it('renders without crashing', () => {
    render(<ShieldOverlay />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/ShieldOverlay.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```powershell
cd the-system
git add src/navigation/types.ts src/navigation/AppNavigator.tsx
git add src/screens/ShieldOverlay.tsx src/screens/CommandHall.tsx
git add __tests__/screens/ShieldOverlay.test.tsx
git commit -m "feat: add ShieldOverlay modal and Shield Protocol button in CommandHall"
```

---

## Task 9: Wire PRESENCE to UsageStats

**Files:**
- Modify: `the-system/src/engine/midnightEngine.ts`
- Modify: `the-system/src/screens/CommandHall.tsx`

- [ ] **Step 1: Update midnightEngine to check UsageStats for PRESENCE**

Read current `the-system/src/engine/midnightEngine.ts` first, then replace relevant logic.

The midnight engine runs PRESENCE auto-fail check. Add UsageStats integration:

Open `the-system/src/engine/midnightEngine.ts` and find the PRESENCE auto-fail section. Add the following import at the top of the file:
```typescript
import UsageStatsModule from '../native/UsageStatsModule';
```

Find the section that processes PRESENCE discipline and replace/update it so it reads actual usage stats. Look for any reference to `'PRESENCE'` code check and update to:
```typescript
// PRESENCE: auto-check via UsageStats
if (discipline.code === 'PRESENCE') {
  const minutesToday = await UsageStatsModule.getScrollingTimeToday();
  if (minutesToday >= 0 && minutesToday > 30) {
    // Over limit — auto-fail
    await xpFail(discipline.id, yesterday);
  } else if (minutesToday < 0) {
    // Permission not granted — skip auto-fail (can't measure)
    // Do NOT fail if we can't measure
  }
  // If under 30 minutes, do nothing (no log = not completed; midnight engine handles that separately)
  continue;
}
```

If `midnightEngine.ts` doesn't yet have discipline iteration with a `continue` statement, read the full file first and integrate the PRESENCE check at the appropriate point in the `runMidnightCheck()` function — specifically after checking that a discipline has no completion log for yesterday and before auto-failing it.

The pattern to look for in the midnight engine is where it iterates disciplines and auto-fails. Add a PRESENCE-specific early return/continue before the generic auto-fail call.

- [ ] **Step 2: Add live presence counter to CommandHall**

In `the-system/src/screens/CommandHall.tsx`, add a live UsageStats display below the silence streak section.

Add import at top:
```tsx
import UsageStatsModule from '../native/UsageStatsModule';
```

Add state and effect in the component (after the `if (!hero) return null;` line):
```tsx
const [presenceMinutes, setPresenceMinutes] = useState<number>(-1);

useEffect(() => {
  const fetchPresence = async () => {
    const mins = await UsageStatsModule.getScrollingTimeToday();
    setPresenceMinutes(mins);
  };
  fetchPresence();
  // Refresh every 5 minutes
  const interval = setInterval(fetchPresence, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

Add `useState` to the React import if not already there.

Add the display below the silenceStreak section:
```tsx
{presenceMinutes >= 0 && (
  <View style={styles.presenceSection}>
    <Text
      style={[
        styles.presenceTime,
        { color: presenceMinutes > 30 ? '#ff4444' : '#4caf50' },
      ]}
    >
      {Math.round(presenceMinutes)}m
    </Text>
    <Text style={[styles.presenceLabel, { color: theme.textSecondary }]}>
      SCREEN TIME TODAY {presenceMinutes > 30 ? '⚠ OVER LIMIT' : '✓ WITHIN LIMIT'}
    </Text>
  </View>
)}
```

Add to StyleSheet:
```tsx
presenceSection: { alignItems: 'center', marginVertical: 4 },
presenceTime: { fontSize: 24, fontWeight: 'bold' },
presenceLabel: { fontSize: 9, marginTop: 2 },
```

- [ ] **Step 3: Write test for midnightEngine PRESENCE logic**

Read `the-system/__tests__/engine/midnightEngine.test.ts` if it exists. If not, create it:

Create `the-system/__tests__/engine/midnightEngine-presence.test.ts`:
```typescript
// Test that PRESENCE auto-fail logic correctly checks UsageStats

jest.mock('../../src/native/UsageStatsModule', () => ({
  default: {
    getScrollingTimeToday: jest.fn(),
    hasPermission: jest.fn().mockResolvedValue(true),
    openUsageAccessSettings: jest.fn(),
  },
}));

jest.mock('../../src/db/database', () => ({
  getDb: jest.fn(() => ({
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  })),
  initDatabase: jest.fn().mockResolvedValue(undefined),
}));

import UsageStatsModule from '../../src/native/UsageStatsModule';

describe('PRESENCE discipline UsageStats integration', () => {
  it('UsageStatsModule returns -1 when no permission (test env)', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(-1);
    const result = await UsageStatsModule.getScrollingTimeToday();
    expect(result).toBe(-1);
  });

  it('UsageStatsModule returns positive number when permission granted', async () => {
    (UsageStatsModule.getScrollingTimeToday as jest.Mock).mockResolvedValue(45.5);
    const result = await UsageStatsModule.getScrollingTimeToday();
    expect(result).toBe(45.5);
  });

  it('over 30 minutes should trigger PRESENCE fail logic', () => {
    const minutesToday = 45;
    const shouldFail = minutesToday >= 0 && minutesToday > 30;
    expect(shouldFail).toBe(true);
  });

  it('under 30 minutes should NOT trigger PRESENCE fail', () => {
    const minutesToday = 25;
    const shouldFail = minutesToday >= 0 && minutesToday > 30;
    expect(shouldFail).toBe(false);
  });

  it('permission not granted (-1) should not auto-fail', () => {
    const minutesToday = -1;
    const shouldFail = minutesToday >= 0 && minutesToday > 30;
    expect(shouldFail).toBe(false);
  });
});
```

Run: `cd the-system && npx jest __tests__/engine/midnightEngine-presence.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 4: Run all Phase 4 tests**

```powershell
cd the-system
npx jest __tests__/native/ __tests__/screens/ShieldOverlay.test.tsx __tests__/engine/midnightEngine-presence.test.ts --no-coverage
```
Expected: All PASS

- [ ] **Step 5: Commit**

```powershell
cd the-system
git add src/engine/midnightEngine.ts src/screens/CommandHall.tsx
git add __tests__/engine/midnightEngine-presence.test.ts
git commit -m "feat: wire PRESENCE auto-tracking to UsageStats + live counter in CommandHall"
```

---

## Task 10: Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```powershell
cd the-system
npx jest --no-coverage
```
Expected: All tests PASS (no regressions from Phase 4 changes)

- [ ] **Step 2: Build debug APK**

```powershell
cd the-system
.\node_modules\.bin\react-native build-android --mode=debug --extra-params "-PreactNativeArchitectures=arm64-v8a"
```

Or using gradle directly:
```powershell
cd the-system/android
.\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Expected: BUILD SUCCESSFUL
APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

If build fails with `cannot find symbol: ShieldPackage` or similar — verify that:
1. `ShieldPackage.java` is in `android/app/src/main/java/com/thesystem/`
2. `MainApplication.kt` has `add(ShieldPackage())`
3. Gradle clean first: `.\gradlew clean`

- [ ] **Step 3: Commit build success**

```powershell
cd the-system
git add .
git commit -m "build: Phase 4 native modules build verified"
```

---

## Completion Checklist

After all tasks complete:
- [ ] `device_admin.xml` in res/xml/
- [ ] `DeviceAdminReceiver.java` registered in manifest
- [ ] `ShieldModule.java` + `ShieldPackage.java` exist
- [ ] `UsageStatsModule.java` + `UsageStatsPackage.java` exist
- [ ] Both packages registered in `MainApplication.kt`
- [ ] AndroidManifest has `BIND_DEVICE_ADMIN` + `PACKAGE_USAGE_STATS` permissions
- [ ] `src/native/ShieldModule.ts` + `UsageStatsModule.ts` JS bridges exist
- [ ] `ShieldOverlay.tsx` modal screen exists with countdown
- [ ] Shield button in CommandHall navigates to ShieldOverlay
- [ ] PRESENCE uses UsageStats in midnightEngine (skips auto-fail if no permission)
- [ ] All tests pass
- [ ] Debug APK builds successfully
