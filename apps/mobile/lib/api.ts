import { createApiClient } from "@repo/api-client";
import { Platform } from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not set — see apps/mobile/.env.example.");
}

const resolvedApiUrl =
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : apiUrl;

/**
 * Talks to apps/web's API routes over HTTP — in dev, point this at your
 * machine's LAN IP (the same "Network" address `expo start` prints), not
 * localhost, since the phone/simulator is a separate device on the network.
 */
export const api = createApiClient(resolvedApiUrl);
