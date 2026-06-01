import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodIssues } from "@/lib/zod-errors";
import { registerUser, toAuthResponse } from "@/lib/auth/users";
import { signAccessToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/cookies";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name } = registerSchema.parse(body);

    const session = await registerUser({ email, password, full_name });
    const token = await signAccessToken(session);

    const response = NextResponse.json(
      { ...toAuthResponse(session), message: "Qeydiyyat uğurludur" },
      { status: 201 }
    );
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
    const status = message.includes("artıq") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
