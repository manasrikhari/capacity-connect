import { SignJWT, jwtVerify } from "jose";

/**
 * Server-only JWT helpers for the live-classroom integration.
 *
 * This is deliberately a plain module (NOT "use server") so nothing here is
 * ever exposed as a publicly invokable server action — tokens are only minted
 * from inside authorized actions/route handlers that import these helpers.
 */

/** Thrown when LIVE_OPENGRAPES_JWT_SECRET is not configured. */
export class LiveSecretMissingError extends Error {
  constructor() {
    super(
      "LIVE_OPENGRAPES_JWT_SECRET is not set. Configure it in lms/.env (it must match the live classroom server) before using live classes."
    );
    this.name = "LiveSecretMissingError";
  }
}

function getLiveSecret(): Uint8Array {
  const secret = process.env.LIVE_OPENGRAPES_JWT_SECRET?.trim();
  if (!secret) throw new LiveSecretMissingError();
  return new TextEncoder().encode(secret);
}

export type LiveTokenUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type LiveRole = "student" | "teacher";

/** Mint a short-lived participant token for the live classroom (port 3002). */
export async function generateLiveToken(
  user: LiveTokenUser,
  role: LiveRole,
  meetingId: string,
  batchId: string
): Promise<string> {
  return new SignJWT({
    userId: user.id,
    name: user.name || "Participant",
    email: user.email,
    role,
    meetingId,
    batchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getLiveSecret());
}

export type LiveServiceClaims = {
  scope: "live-service";
  roomId: string;
  batchId: string;
};

/**
 * Verify a service-to-service token minted by the live classroom backend.
 * Requires HS256 with the shared secret and claims
 * { scope: "live-service", roomId: string, batchId: string }.
 *
 * Throws LiveSecretMissingError when the secret is unset, and a generic Error
 * for any invalid/expired token or missing claim.
 */
export async function verifyLiveServiceToken(token: string): Promise<LiveServiceClaims> {
  const { payload } = await jwtVerify(token, getLiveSecret(), {
    algorithms: ["HS256"],
  });

  if (
    payload.scope !== "live-service" ||
    typeof payload.roomId !== "string" ||
    payload.roomId.length === 0 ||
    typeof payload.batchId !== "string" ||
    payload.batchId.length === 0
  ) {
    throw new Error("Invalid live-service token claims");
  }

  return { scope: "live-service", roomId: payload.roomId, batchId: payload.batchId };
}
