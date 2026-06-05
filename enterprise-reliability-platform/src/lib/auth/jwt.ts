import { SignJWT, jwtVerify } from "jose";
import {
  getJwtSecret,
  JWT_EXPIRES_IN_SECONDS,
} from "./config";
import type { JwtPayload, SessionUser, UserRole } from "./types";

function secretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signAccessToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: user.email,
    role: user.role,
    full_name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_EXPIRES_IN_SECONDS)
    .sign(secretKey());
}

export async function verifyAccessToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });

    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      !isUserRole(role)
    ) {
      return null;
    }

    return {
      userId: sub,
      email,
      role,
      fullName:
        typeof payload.full_name === "string" ? payload.full_name : null,
    };
  } catch {
    return null;
  }
}

function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "manager" || value === "customer";
}

export type { JwtPayload };
