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

    private static final List<String> TRACKED_PACKAGES = Arrays.asList(
        "com.android.chrome",
        "org.mozilla.firefox",
        "com.instagram.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.zhiliaoapp.musically",
        "com.reddit.frontpage",
        "com.google.android.youtube",
        "com.facebook.orca",
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
            long now = System.currentTimeMillis();
            long oneHourAgo = now - 3600000L;
            Map<String, UsageStats> stats =
                usm.queryAndAggregateUsageStats(oneHourAgo, now);
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
