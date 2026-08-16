import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A device-only flag (no accounts, nothing to sync) — stored as a React
 * Query cache entry riding the same AsyncStorage persister already wired
 * for the feed query cache (see lib/queryClient.ts), same pattern as
 * lib/topicSelection.ts.
 */
const HAS_SEEN_ONBOARDING_KEY = ["hasSeenOnboarding"] as const;

export function useHasSeenOnboarding() {
  const { data } = useQuery<boolean>({
    queryKey: HAS_SEEN_ONBOARDING_KEY,
    queryFn: () => Promise.resolve(false),
    initialData: false,
    staleTime: Infinity,
  });
  return data ?? false;
}

export function useMarkOnboardingSeen() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.setQueryData<boolean>(HAS_SEEN_ONBOARDING_KEY, true);
  };
}
