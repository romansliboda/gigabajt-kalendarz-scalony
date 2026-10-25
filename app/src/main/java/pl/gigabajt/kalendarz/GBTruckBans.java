package pl.gigabajt.kalendarz;
import java.net.*;
import java.io.*;
class GBTruckBans {
static String pobierz() throws Exception {
URL url = new URL("https://truckbans.com/ics/europe.ics");
HttpURLConnection c = (HttpURLConnection) url.openConnection();
c.setConnectTimeout(15000);
c.setReadTimeout(20000);
try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
byte[] buf = new byte[8192];
int n;
while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
return out.toString("UTF-8");
}
finally { c.disconnect(); }
}
}
