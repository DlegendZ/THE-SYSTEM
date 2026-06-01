package com.thesystem;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Schedules / presents rich notifications (large icon + avatar BigPicture +
 * actions) that expo-notifications cannot produce. Scheduling uses AlarmManager
 * so the notification is built natively at fire time.
 */
public class RichNotificationModule extends ReactContextBaseJavaModule {

    private static final int MAX_IDS = 256; // cancellation range

    private final ReactApplicationContext reactContext;

    public RichNotificationModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "RichNotificationModule";
    }

    private PendingIntent alarmIntent(int id, String title, String body, String bigPic) {
        Intent intent = new Intent(reactContext, RichNotificationReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("bigPic", bigPic);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(reactContext, id, intent, flags);
    }

    @ReactMethod
    public void schedule(int id, String title, String body, double fireAtMs, String bigPic, Promise promise) {
        try {
            AlarmManager am = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
            if (am == null) { promise.reject("NO_ALARM", "AlarmManager unavailable"); return; }
            PendingIntent pi = alarmIntent(id, title, body, bigPic);
            long when = (long) fireAtMs;
            // Exact alarms need SCHEDULE_EXACT_ALARM on Android 12+, which is
            // denied by default on Android 13/14. Motivational reminders don't
            // need exact timing, so fall back to an inexact (no-permission)
            // alarm when exact scheduling isn't permitted — otherwise
            // setExactAndAllowWhileIdle throws SecurityException and the
            // notification is never scheduled.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, when, pi);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SCHEDULE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void presentNow(String title, String body, String bigPic, Promise promise) {
        try {
            RichNotificationReceiver.post(reactContext, 999, title, body, bigPic);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("PRESENT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAll(Promise promise) {
        try {
            AlarmManager am = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
            for (int id = 0; id < MAX_IDS; id++) {
                PendingIntent pi = alarmIntent(id, null, null, null);
                if (am != null) am.cancel(pi);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CANCEL_ERROR", e.getMessage());
        }
    }
}
