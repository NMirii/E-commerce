import { getTokenFromCookies, getTokenFromRequest } from "./cookies";
import { verifyAccessToken } from "./jwt";
import type { SessionUser, UserRole } from "./types";

export async function getSession(): Promise<SessionUser | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function hasRole(
  session: SessionUser,
  roles: UserRole[]
): boolean {
  return roles.includes(session.role);
}

export async function requireRole(
  roles: UserRole[]
): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasRole(session, roles)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
