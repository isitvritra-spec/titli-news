import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";

/**
 * The primary mobile freshness mechanism (alongside pull-to-refresh) — no
 * push infrastructure needed. A reader opening the app is always pulling
 * the latest published cards.
 */
export function useRefetchOnForeground() {
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      focusManager.setFocused(status === "active");
    }
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);
}
