package ir.aeliux.webq;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.provider.Settings;
import android.widget.Toast;

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
        } else if ("showToast".equals(action)) {
            String message = args.getString(0);
            boolean isLong = args.getBoolean(1);
            showToast(message, isLong, callbackContext);
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

    private void showToast(String message, boolean isLong, CallbackContext callbackContext) {
        int duration = isLong ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT;
        Toast.makeText(this.cordova.getActivity(), message, duration).show();
        callbackContext.success("Toast shown");
    }
}
