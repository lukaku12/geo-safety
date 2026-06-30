import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-side Supabase client typed against our schema.
 *
 * Uses the service-role key, so it must only ever run on the server (Route
 * Handlers / server modules). The `server-only` import above is the guardrail.
 * There is no user auth in this task, so we disable session persistence — every
 * request is a fresh, stateless admin connection.
 *
 * The client is created lazily and memoised per server runtime so we don't
 * rebuild it on every request, while still avoiding work at module-eval time.
 */
let client: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (client) return client;

  const env = getServerEnv();
  client = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return client;
}
