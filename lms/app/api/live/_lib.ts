import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  LiveSecretMissingError,
  verifyLiveServiceToken,
  type LiveServiceClaims,
} from "@/lib/live-token";

type AuthResult =
  | { claims: LiveServiceClaims; response?: undefined }
  | { claims?: undefined; response: NextResponse };

/**
 * Authenticate a service-to-service call from the live classroom backend:
 * Authorization: Bearer <HS256 JWT> with claims
 * { scope: "live-service", roomId, batchId }.
 * 401 on missing/invalid token, 503 when the shared secret is unset.
 */
export async function authenticateLiveService(req: NextRequest): Promise<AuthResult> {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return {
      response: NextResponse.json({ error: "Missing bearer token" }, { status: 401 }),
    };
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    return { claims: await verifyLiveServiceToken(token) };
  } catch (err) {
    if (err instanceof LiveSecretMissingError) {
      return {
        response: NextResponse.json(
          { error: "Live service is not configured on this server" },
          { status: 503 }
        ),
      };
    }
    return {
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}

type BodyResult<S extends z.ZodType> =
  | { data: z.output<S>; response?: undefined }
  | { data?: undefined; response: NextResponse };

/** Parse and validate a JSON body (missing/invalid JSON is treated as {}). */
export async function parseJsonBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): Promise<BodyResult<S>> {
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 }
      ),
    };
  }
  return { data: parsed.data };
}

/** Get-or-create the LiveSession row for a room (idempotent). */
export async function ensureLiveSession(roomId: string, batchId: string) {
  return prisma.liveSession.upsert({
    where: { roomId },
    update: {},
    create: { roomId, batchId, status: "live" },
  });
}

export function jsonOk() {
  return NextResponse.json({ ok: true });
}

export function internalError(context: string, err: unknown) {
  console.error(`[live-api] ${context} failed:`, err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
