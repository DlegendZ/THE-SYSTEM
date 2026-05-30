package com.thesystem;

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
