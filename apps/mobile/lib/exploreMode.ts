import { useQuery, useQueryClient } from "@tanstack/react-query";

export const EXPLORE_MODES = ["Surprise me", "Useful", "Hopeful", "Debatable"] as const;
export type ExploreMode = typeof EXPLORE_MODES[number];

const EXPLORE_MODE_KEY = ["exploreMode"] as const;

export function useExploreMode(): ExploreMode {
  const { data } = useQuery<ExploreMode>({
    queryKey: EXPLORE_MODE_KEY,
    queryFn: () => Promise.resolve("Surprise me"),
    initialData: "Surprise me",
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data;
}

export function useSetExploreMode() {
  const queryClient = useQueryClient();
  return (mode: ExploreMode) => queryClient.setQueryData(EXPLORE_MODE_KEY, mode);
}
