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
