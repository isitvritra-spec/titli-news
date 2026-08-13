import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A device-only preference (no accounts, nothing to sync) — stored as a
 * React Query cache entry rather than a second storage system, so it rides
 * along on the same AsyncStorage persister already wired for the feed
 * query cache (see lib/queryClient.ts).
 */
const SELECTED_TOPICS_KEY = ["selectedTopics"] as const;

export function useSelectedTopics() {
  const { data } = useQuery<string[]>({
    queryKey: SELECTED_TOPICS_KEY,
    queryFn: () => Promise.resolve([]),
    initialData: [],
    staleTime: Infinity,
  });
  return data ?? [];
}

export function useToggleTopic() {
  const queryClient = useQueryClient();
  return (slug: string) => {
    queryClient.setQueryData<string[]>(SELECTED_TOPICS_KEY, (current = []) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  };
}
