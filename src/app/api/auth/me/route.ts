import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api";
import { toAuthResponse } from "@/lib/auth/users";

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(toAuthResponse(session));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
