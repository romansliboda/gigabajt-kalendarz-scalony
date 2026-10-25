package pl.gigabajt.kalendarz;


import androidx.webkit.WebViewAssetLoader;
import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.GeolocationPermissions;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.app.Activity;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.content.Context;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private String pendingOrigin;
    private GeolocationPermissions.Callback pendingCallback;

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults) {
        super.onRequestPermissionsResult(
            requestCode, permissions, grantResults);

        if (requestCode == 1001 && pendingCallback != null) {
            boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;

            pendingCallback.invoke(pendingOrigin, granted, false);
            pendingCallback = null;
            pendingOrigin = null;
        }
    }

    private WebView web;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public String pobierz() {
                try {
                    return GBTruckBans.pobierz();
                } catch (Exception e) { android.util.Log.e("GB_TRUCKBANS", "Blad pobierania danych TruckBans", e);
                    return "";
                }
            }
        }, "GBTruckBans");
        web.setWebViewClient(new WebViewClient() { public android.webkit.WebResourceResponse shouldInterceptRequest(WebView v, android.webkit.WebResourceRequest r) { return new WebViewAssetLoader.Builder().addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(MainActivity.this)).build().shouldInterceptRequest(r.getUrl()); } });
        
web.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onGeolocationPermissionsShowPrompt(
        String origin,
        GeolocationPermissions.Callback callback) {

        if (ContextCompat.checkSelfPermission(
                MainActivity.this,
                Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            callback.invoke(origin, true, false);
        } else {
            pendingOrigin = origin;
            pendingCallback = callback;
            ActivityCompat.requestPermissions(
                MainActivity.this,
                new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                1001);
        }
    }
});

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setDefaultTextEncodingName("UTF-8");
        web.setBackgroundColor(0xFFFFFFFF);
        setContentView(web);
        web.getSettings().setGeolocationEnabled(true);
        web.addJavascriptInterface(new GBUpdaterNative(this, web), "GBUpdater");
                web.addJavascriptInterface(new GBPdfExport(this, web), "GBAndroid");
        web.addJavascriptInterface(new Object() { @android.webkit.JavascriptInterface public String getBuildCode() { try { return String.valueOf(MainActivity.this.getPackageManager().getPackageInfo(MainActivity.this.getPackageName(),0).versionCode); } catch(Exception e) { return ""; } } }, "GBAppBuild");
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }
    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
