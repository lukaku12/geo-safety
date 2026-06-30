import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

import { ServiceError } from "@/lib/services/errors";

export interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Single funnel for turning thrown errors into JSON responses, so every route
 * reports failures the same way:
 *   - ZodError      → 400 with field-level issues
 *   - ServiceError  → its own status (404/422/…)
 *   - anything else → 500 (message hidden in production)
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Let Next.js control-flow signals (redirect / notFound / prerender bailout)
  // propagate instead of being swallowed as a 500.
  unstable_rethrow(error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", details: error.flatten() },
      { status: 400 },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Unhandled API error:", error);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Internal server error";

  return NextResponse.json({ error: message }, { status: 500 });
}

export function json<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}
