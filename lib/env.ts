import "server-only";

import { z } from "zod";

/**
 * Server-only environment contract. Importing this module from a Client
 * Component is a build error (via `server-only`), so the service-role key can
 * never leak into the browser bundle.
 *
 * Validation is *lazy and memoised*: it runs the first time a request actually
 * needs the credentials, not at module-eval time. That matters because Next.js
 * evaluates route modules during `next build` (to read their config exports),
 * and we don't want a missing-env error to fail the build of an app whose
 * secrets are only present at runtime (e.g. on Vercel).
 */
const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n` +
        `Copy .env.example to .env.local and fill in your Supabase credentials.`,
    );
  }

  cached = parsed.data;
  return cached;
}
