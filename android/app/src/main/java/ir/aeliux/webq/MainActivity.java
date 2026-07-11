package ir.aeliux.webq;

import android.os.Build;
import android.os.Bundle;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // My emulators does not show good signs, so i disable it until i have a real pgone or learn how to fix this
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            WindowCompat.enableEdgeToEdge(getWindow());
        }
    }
}
