import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A device-only bookmark list (no accounts, nothing to sync) — stored as a
 * React Query cache entry riding the same AsyncStorage persister already
 * wired for the feed query cache (see lib/queryClient.ts), same pattern as
 * lib/topicSelection.ts's selected-topics state.
 */
const SAVED_CARD_IDS_KEY = ["savedCardIds"] as const;

export function useSavedCardIds() {
  const { data } = useQuery<string[]>({
    queryKey: SAVED_CARD_IDS_KEY,
    queryFn: () => Promise.resolve([]),
    initialData: [],
    staleTime: Infinity,
  });
  return data ?? [];
}

export function useToggleSaved() {
  const queryClient = useQueryClient();
  return (id: string) => {
    queryClient.setQueryData<string[]>(SAVED_CARD_IDS_KEY, (current = []) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  };
}
