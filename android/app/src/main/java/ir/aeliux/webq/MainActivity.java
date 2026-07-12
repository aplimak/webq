package ir.aeliux.webq;

import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import uniffi.webq_rs.Webq_rsKt;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        boolean isDebuggable = (0 != (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE));
        if (isDebuggable) {
            int res = Webq_rsKt.add(5, 6);
            if (res != 11) {
                throw new RuntimeException("webq_rs does not work properly");
            } else {
                Log.i("webq_rs", "webq_rs working as expected");
            }
        }

        registerPlugin(WebQPlugin.class);
        super.onCreate(savedInstanceState);
        // My emulators do not show good signs, so i disable it until i have a real pgone or learn how to fix this
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            WindowCompat.enableEdgeToEdge(getWindow());
        }
    }
}
