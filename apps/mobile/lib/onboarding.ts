import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A device-only flag (no accounts, nothing to sync) — stored as a React
 * Query cache entry riding the same AsyncStorage persister already wired
 * for the feed query cache (see lib/queryClient.ts), same pattern as
 * lib/topicSelection.ts.
 */
const HAS_SEEN_ONBOARDING_KEY = ["hasSeenOnboarding"] as const;
const HAS_SEEN_ONBOARDING_STORAGE_KEY = "titli-has-seen-onboarding";

export function useOnboardingStatus() {
  return useQuery<boolean>({
    queryKey: HAS_SEEN_ONBOARDING_KEY,
    queryFn: async () => (await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_STORAGE_KEY)) === "true",
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMarkOnboardingSeen() {
  const queryClient = useQueryClient();
  return async () => {
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_STORAGE_KEY, "true");
    queryClient.setQueryData<boolean>(HAS_SEEN_ONBOARDING_KEY, true);
  };
}
