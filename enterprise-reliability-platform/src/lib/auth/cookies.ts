import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  JWT_COOKIE_NAME,
  JWT_EXPIRES_IN_SECONDS,
  isProduction,
} from "./config";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: JWT_EXPIRES_IN_SECONDS,
};

export async function getTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(JWT_COOKIE_NAME)?.value;
}

export function attachAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(JWT_COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(JWT_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(JWT_COOKIE_NAME, token, cookieOptions);
}

export async function deleteAuthCookie() {
  const store = await cookies();
  store.delete(JWT_COOKIE_NAME);
}

export function getTokenFromRequest(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${JWT_COOKIE_NAME}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(JWT_COOKIE_NAME.length + 1));
}
