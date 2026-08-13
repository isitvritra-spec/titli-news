import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

/** Lets a reader open the app offline and still see the last-seen feed. */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "bite-feed-query-cache",
});
