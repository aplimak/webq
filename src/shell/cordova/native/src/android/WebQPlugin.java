package ir.aeliux.webq;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.provider.Settings;

public class WebQPlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("echo".equals(action)) {
            String message = args.getString(0);
            callbackContext.success("Echo from Android: " + message);
            return true;
        } else if ("openSettings".equals(action)) {
            openSettings(callbackContext);
            return true;
        }
        callbackContext.error("Action not recognized");
        return false;
    }

    private void openSettings(CallbackContext callbackContext) {
        try {
            Intent intent = new Intent(Settings.ACTION_SETTINGS);
            // FLAG_ACTIVITY_NEW_TASK is needed because we're starting from a non-activity context
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            this.cordova.getActivity().startActivity(intent);
            callbackContext.success("Settings opened successfully");
        } catch (Exception e) {
            callbackContext.error("Failed to open settings: " + e.getMessage());
        }
    }
}
