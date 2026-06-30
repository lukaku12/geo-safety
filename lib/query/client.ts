import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * One QueryClient per browser tab, a fresh one per server render. The singleton
 * guard avoids re-creating the cache on every React re-render while preventing
 * cross-request state leakage on the server.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — reconciliation data is not second-by-second
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
