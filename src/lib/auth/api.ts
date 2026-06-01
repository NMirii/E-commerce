import { NextResponse } from "next/server";
import { getSessionFromRequest, requireRole } from "./session";
import type { SessionUser, UserRole } from "./types";

export async function getApiSession(
  request: Request
): Promise<SessionUser | null> {
  return getSessionFromRequest(request);
}

export async function requireApiSession(
  request: Request
): Promise<SessionUser | NextResponse> {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireApiRole(
  request: Request,
  roles: UserRole[]
): Promise<SessionUser | NextResponse> {
  const result = await requireApiSession(request);
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}
