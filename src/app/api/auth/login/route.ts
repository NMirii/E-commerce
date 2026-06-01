import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodIssues } from "@/lib/zod-errors";
import { authenticateUser, toAuthResponse } from "@/lib/auth/users";
import { signAccessToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const session = await authenticateUser(email, password);
    const token = await signAccessToken(session);

    const response = NextResponse.json(toAuthResponse(session));
    attachAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: zodIssues(error) },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Server error";
    const status = message.includes("yanlış") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
