package com.chinhsiang.premiumnotes;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.File;

public class UpdateHandler {
    private static final String GITHUB_API_URL = "https://api.github.com/repos/HHGold/GNote/releases/latest";
    private static long downloadId = -1;

    public interface UpdateCallback {
        void onResult(String status, String message);
    }

    public static void checkForUpdate(final Context context, final String currentVersion,
            final UpdateCallback callback) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(GITHUB_API_URL);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("GET");
                    connection.setRequestProperty("Accept", "application/vnd.github.v3+json");
                    connection.setConnectTimeout(5000);
                    connection.setReadTimeout(5000);

                    if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                        StringBuilder result = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            result.append(line);
                        }
                        reader.close();

                        JSONObject json = new JSONObject(result.toString());
                        String latestVersion = json.getString("tag_name");
                        if (latestVersion.startsWith("v")) {
                            latestVersion = latestVersion.substring(1);
                        }

                        if (isNewerVersion(currentVersion, latestVersion)) {
                            JSONArray assets = json.getJSONArray("assets");
                            String apkUrl = "";
                            for (int i = 0; i < assets.length(); i++) {
                                JSONObject asset = assets.getJSONObject(i);
                                if (asset.getString("name").endsWith(".apk")) {
                                    apkUrl = asset.getString("browser_download_url");
                                    break;
                                }
                            }

                            if (!apkUrl.isEmpty()) {
                                final String finalApkUrl = apkUrl;
                                final String finalVersion = latestVersion;
                                runOnUi(context, new Runnable() {
                                    @Override
                                    public void run() {
                                        callback.onResult("UPDATE_FOUND", finalVersion);
                                        downloadUpdate(context, finalApkUrl, finalVersion);
                                    }
                                });
                            } else {
                                runOnUi(context, new Runnable() {
                                    @Override
                                    public void run() {
                                        callback.onResult("NO_UPDATE", "");
                                    }
                                });
                            }
                        } else {
                            runOnUi(context, new Runnable() {
                                @Override
                                public void run() {
                                    callback.onResult("NO_UPDATE", "");
                                }
                            });
                        }
                    } else {
                        runOnUi(context, new Runnable() {
                            @Override
                            public void run() {
                                callback.onResult("ERROR", "Server response error");
                            }
                        });
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    runOnUi(context, new Runnable() {
                        @Override
                        public void run() {
                            callback.onResult("ERROR", "Network error");
                        }
                    });
                }
            }
        }).start();
    }

    private static void runOnUi(Context context, Runnable action) {
        if (context instanceof android.app.Activity) {
            ((android.app.Activity) context).runOnUiThread(action);
        }
    }

    private static boolean isNewerVersion(String current, String latest) {
        try {
            String[] currParts = current.split("\\.");
            String[] latParts = latest.split("\\.");
            int length = Math.max(currParts.length, latParts.length);
            for (int i = 0; i < length; i++) {
                int c = i < currParts.length ? Integer.parseInt(currParts[i]) : 0;
                int l = i < latParts.length ? Integer.parseInt(latParts[i]) : 0;
                if (l > c)
                    return true;
                if (c > l)
                    return false;
            }
            return false;
        } catch (Exception e) {
            return !current.equals(latest);
        }
    }

    private static void downloadUpdate(final Context context, String url, final String version) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("更新 GNote v" + version);
            request.setDescription("正在下載最新版本...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS,
                    "GNote_" + version + ".apk");

            final DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            downloadId = manager.enqueue(request);
            Toast.makeText(context, "發現新版本，開始下載...", Toast.LENGTH_SHORT).show();

            BroadcastReceiver receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctx, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        installApk(context, version);
                    }
                }
            };

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                        Context.RECEIVER_EXPORTED);
            } else {
                context.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(context, "下載失敗: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private static void installApk(Context context, String version) {
        try {
            File file = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                    "GNote_" + version + ".apk");
            if (!file.exists())
                return;

            Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(context, "安裝失敗，無法開啟 APK", Toast.LENGTH_SHORT).show();
        }
    }
}
