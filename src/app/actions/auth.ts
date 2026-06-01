"use server";

import { redirect } from "next/navigation";
import { authenticateUser, registerUser } from "@/lib/auth/users";
import { signAccessToken } from "@/lib/auth/jwt";
import { setAuthCookie, deleteAuthCookie } from "@/lib/auth/cookies";

export type AuthState = { error?: string } | undefined;

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const session = await authenticateUser(email, password);
    const token = await signAccessToken(session);
    await setAuthCookie(token);
    redirect("/account");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Giriş uğursuz oldu",
    };
  }
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const session = await registerUser({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      full_name: (formData.get("full_name") as string) || undefined,
    });
    const token = await signAccessToken(session);
    await setAuthCookie(token);
    redirect("/account");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Qeydiyyat uğursuz oldu",
    };
  }
}

export async function signOut() {
  await deleteAuthCookie();
  redirect("/login");
}
