import { Platform } from "react-native";

let Native: {
  hasUsageAccess(): boolean;
  hasOverlayPermission(): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  startBlocker(packages: string[]): void;
  stopBlocker(): void;
  updateBlockingState(active: boolean): void;
} | null = null;

if (Platform.OS === "android") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require("expo-modules-core");
    Native = requireNativeModule("AppBlocker");
  } catch {
    // Expo Go — native module not linked
  }
}

export function hasUsageAccess(): boolean {
  return Native?.hasUsageAccess() ?? false;
}

export function hasOverlayPermission(): boolean {
  return Native?.hasOverlayPermission() ?? false;
}

export function openUsageAccessSettings(): void {
  Native?.openUsageAccessSettings();
}

export function openOverlaySettings(): void {
  Native?.openOverlaySettings();
}

export function startBlocker(packages: string[]): void {
  Native?.startBlocker(packages);
}

export function stopBlocker(): void {
  Native?.stopBlocker();
}

export function updateBlockingState(active: boolean): void {
  Native?.updateBlockingState(active);
}
