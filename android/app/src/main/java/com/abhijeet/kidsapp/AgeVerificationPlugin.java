package com.alphagaming.brainGamesHub;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.agesignals.AgeSignalsManager;
import com.google.android.play.agesignals.AgeSignalsManagerFactory;
import com.google.android.play.agesignals.AgeSignalsRequest;

@CapacitorPlugin(name = "AgeVerification")
public class AgeVerificationPlugin extends Plugin {

    @PluginMethod
    public void getAgeSignal(PluginCall call) {
        AgeSignalsManager manager = AgeSignalsManagerFactory.create(getContext());
        AgeSignalsRequest request = AgeSignalsRequest.builder().build();

        manager.checkAgeSignals(request)
            .addOnSuccessListener(result -> {
                JSObject ret = new JSObject();
                // Map the new result fields
                ret.put("status", result.userStatus());
                ret.put("ageLower", result.ageLower());
                ret.put("ageUpper", result.ageUpper());
                
                // Legacy field support for the current frontend implementation
                // We'll treat status as the primary signal
                ret.put("ageSignal", result.userStatus());
                ret.put("isVerified", result.userStatus() != null);
                
                call.resolve(ret);
            })
            .addOnFailureListener(e -> {
                call.reject("Failed to get age signals: " + e.getMessage());
            });
    }
}
