package pl.gigabajt.kalendarz;

import android.app.Activity;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

/** Android system PDF save dialog; leaves WebView localStorage untouched. */
public final class GBPdfExport {
    private final Activity activity;
    private final WebView web;

    public GBPdfExport(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
    }

    @JavascriptInterface
    public void savePdf() {
        activity.runOnUiThread(() -> {
            try {
                PrintManager manager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                if (manager == null) throw new IllegalStateException("PrintManager unavailable");
                final String name = "GB_Rozliczenie";
                PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(name);
                PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                    .build();
                manager.print(name, adapter, attributes);
            } catch (Exception error) {
                Toast.makeText(activity, "Nie udało się otworzyć zapisu PDF", Toast.LENGTH_LONG).show();
            }
        });
    }
}
