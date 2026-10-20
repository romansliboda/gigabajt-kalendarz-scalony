package pl.gigabajt.kalendarz;


import androidx.webkit.WebViewAssetLoader;
import android.Manifest;
import androidx.webkit.WebViewAssetLoader;
import android.content.pm.PackageManager;
import androidx.webkit.WebViewAssetLoader;
import android.webkit.GeolocationPermissions;
import androidx.webkit.WebViewAssetLoader;
import androidx.core.app.ActivityCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;
import android.app.Activity;
import androidx.webkit.WebViewAssetLoader;
import android.os.Bundle;
import androidx.webkit.WebViewAssetLoader;
import androidx.core.app.ActivityCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;
import android.print.PrintAttributes;
import androidx.webkit.WebViewAssetLoader;
import android.print.PrintManager;
import androidx.webkit.WebViewAssetLoader;
import android.content.Context;
import androidx.webkit.WebViewAssetLoader;
import android.webkit.WebChromeClient;
import androidx.webkit.WebViewAssetLoader;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
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
