package com.thesystem;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
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

    private static final List<String> TRACKED_PACKAGES = Arrays.asList(
        "com.instagram.android",        // Instagram
        "com.zhiliaoapp.musically",     // TikTok (global)
        "com.ss.android.ugc.trill"      // TikTok (alt package, some regions)
    );

    private static final long DAY_MS = 24L * 60L * 60L * 1000L;

    private final ReactApplicationContext reactContext;

    public UsageStatsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "UsageStatsModule";
    }

    /** Reliable Usage Access check via AppOps (queryUsageStats lies — it returns
     *  an empty result, not an error, when access is denied). */
    private boolean hasUsageAccess() {
        try {
            AppOpsManager appOps =
                (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) return false;
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    /** Sum foreground minutes of tracked apps in [start, end]. Uses
     *  getTotalTimeInForeground, which (unlike event pairing) already excludes
     *  screen-off / locked time, matching Digital Wellbeing closely. */
    private double foregroundMinutes(long start, long end) {
        UsageStatsManager usm =
            (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) return -1.0;

        Map<String, UsageStats> map = usm.queryAndAggregateUsageStats(start, end);
        if (map == null || map.isEmpty()) return 0.0;

        long totalMs = 0;
        for (String pkg : TRACKED_PACKAGES) {
            UsageStats s = map.get(pkg);
            if (s != null) totalMs += s.getTotalTimeInForeground();
        }
        return totalMs / 60000.0;
    }

    @ReactMethod
    public void getScrollingTimeToday(Promise promise) {
        try {
            if (!hasUsageAccess()) { promise.resolve(-1.0); return; }
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            long startOfDay = cal.getTimeInMillis();
            promise.resolve(foregroundMinutes(startOfDay, System.currentTimeMillis()));
        } catch (Exception ex) {
            promise.reject("USAGE_ERROR", ex.getMessage());
        }
    }

    /** Foreground minutes for the calendar day starting at startOfDayMillis.
     *  Used by the midnight settler to score The Veil for the day it settles
     *  (not "today"). */
    @ReactMethod
    public void getScrollingTimeForDay(double startOfDayMillis, Promise promise) {
        try {
            if (!hasUsageAccess()) { promise.resolve(-1.0); return; }
            long start = (long) startOfDayMillis;
            long end = Math.min(start + DAY_MS, System.currentTimeMillis());
            if (end <= start) { promise.resolve(-1.0); return; }
            promise.resolve(foregroundMinutes(start, end));
        } catch (Exception ex) {
            promise.reject("USAGE_ERROR", ex.getMessage());
        }
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        promise.resolve(hasUsageAccess());
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
