import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";

const PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
  "android.permission.PACKAGE_USAGE_STATS",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.RECEIVE_BOOT_COMPLETED",
];

const withAppBlocker: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // ── Permissions ──────────────────────────────────────────────────────────
    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];
    for (const perm of PERMISSIONS) {
      const already = manifest["uses-permission"]!.some(
        (p: any) => p.$["android:name"] === perm
      );
      if (!already) {
        manifest["uses-permission"]!.push({ $: { "android:name": perm } });
      }
    }

    const app = manifest.application?.[0];
    if (!app) return cfg;

    // ── Foreground service ───────────────────────────────────────────────────
    if (!app.service) app.service = [];
    const svcName = "expo.modules.appblocker.AppBlockerService";
    if (!app.service.some((s: any) => s.$["android:name"] === svcName)) {
      app.service.push({
        $: {
          "android:name": svcName,
          "android:foregroundServiceType": "dataSync",
          "android:exported": "false",
          "android:enabled": "true",
        },
      });
    }

    return cfg;
  });

export default withAppBlocker;
