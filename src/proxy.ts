import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest, hasRole } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!hasRole(session, ["admin", "manager"])) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (
    (pathname.startsWith("/account") || pathname.startsWith("/checkout")) &&
    !session
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
