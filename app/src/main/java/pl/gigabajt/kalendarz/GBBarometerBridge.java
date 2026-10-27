package pl.gigabajt.kalendarz;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.webkit.JavascriptInterface;
import java.util.Locale;

public final class GBBarometerBridge
        implements SensorEventListener {

    private final SensorManager manager;
    private final Sensor sensor;
    private final Handler handler =
        new Handler(Looper.getMainLooper());

    private volatile float reading = Float.NaN;
    private volatile long lastRequest = 0L;
    private volatile boolean active = false;
    private volatile boolean queued = false;

    public GBBarometerBridge(Context context) {
        manager = (SensorManager)
            context.getSystemService(Context.SENSOR_SERVICE);
        sensor = manager == null ? null :
            manager.getDefaultSensor(Sensor.TYPE_PRESSURE);
    }

    @JavascriptInterface
    public boolean available() {
        return sensor != null;
    }

    private final Runnable idleCheck = new Runnable() {
        @Override public void run() {
            if (!active) return;
            if (SystemClock.elapsedRealtime() -
                    lastRequest > 12000L) {
                manager.unregisterListener(
                    GBBarometerBridge.this);
                active = false;
                reading = Float.NaN;
            } else {
                handler.postDelayed(this, 12000L);
            }
        }
    };

    @JavascriptInterface
    public String pressure() {
        if (sensor == null) return "";

        lastRequest = SystemClock.elapsedRealtime();

        if (!active && !queued) {
            synchronized (this) {
                if (!active && !queued) {
                    queued = true;
                    handler.post(new Runnable() {
                        @Override public void run() {
                            if (!active) {
                                active = manager.registerListener(
                                    GBBarometerBridge.this,
                                    sensor,
                                    SensorManager.SENSOR_DELAY_NORMAL);
                                if (active) {
                                    handler.postDelayed(
                                        idleCheck,12000L);
                                }
                            }
                            queued = false;
                        }
                    });
                }
            }
        }

        float value = reading;
        if (Float.isNaN(value) ||
            Float.isInfinite(value) ||
            value < 300f || value > 1200f)
            return "";

        return String.format(
            Locale.US,"%.1f",(double)value);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType()==Sensor.TYPE_PRESSURE &&
            event.values.length>0) {
            reading = event.values[0];
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor,int accuracy) {
    }
}
