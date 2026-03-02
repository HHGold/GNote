package com.chinhsiang.premiumnotes;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UpdatePlugin")
public class UpdatePlugin extends Plugin {

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        String currentVersion = call.getString("currentVersion", "1.0.0");

        UpdateHandler.checkForUpdate(getContext(), currentVersion, new UpdateHandler.UpdateCallback() {
            @Override
            public void onResult(String status, String message) {
                JSObject ret = new JSObject();
                ret.put("status", status);
                ret.put("message", message);
                call.resolve(ret);
            }
        });
    }
}
