import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { createHash, timingSafeEqual } from "node:crypto";

export type SessionData = {
  isAdmin?: boolean;
};

const sessionOptions = {
  password: requireEnv("ADMIN_SESSION_SECRET"),
  cookieName: "bitefeed_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — see apps/web/.env.example.`);
  }
  return value;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

/**
 * Constant-time comparison so login timing can't leak how much of the
 * password guess was correct. Both sides are hashed to a fixed 32-byte
 * digest first — timingSafeEqual requires equal-length buffers, and
 * hashing sidesteps that (and the length-comparison side-channel) entirely.
 */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = requireEnv("ADMIN_PASSWORD");
  const expectedHash = createHash("sha256").update(expected).digest();
  const candidateHash = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expectedHash, candidateHash);
}
