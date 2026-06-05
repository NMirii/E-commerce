import { createServiceClient } from "@/lib/supabase/service";
import { hashPassword, verifyPassword } from "./password";
import type { SessionUser, UserRole } from "./types";
import { randomUUID } from "crypto";

export async function findUserByEmail(email: string) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, email, full_name, role, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function registerUser(input: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<SessionUser> {
  const email = input.email.toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("Bu e-poçt artıq qeydiyyatdan keçib");
  }

  const password_hash = await hashPassword(input.password);
  const id = randomUUID();
  const full_name = input.full_name?.trim() || "Müştəri";
  const role: UserRole = "customer";

  const db = createServiceClient();
  const { error } = await db.from("profiles").insert({
    id,
    email,
    full_name,
    role,
    password_hash,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Bu e-poçt artıq qeydiyyatdan keçib");
    }
    throw new Error(error.message);
  }

  return { userId: id, email, role, fullName: full_name };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser> {
  const row = await findUserByEmail(email);
  if (!row?.password_hash) {
    throw new Error("E-poçt və ya şifrə yanlışdır");
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    throw new Error("E-poçt və ya şifrə yanlışdır");
  }

  const role = row.role as UserRole;
  return {
    userId: row.id,
    email: row.email,
    role,
    fullName: row.full_name,
  };
}

export function toAuthResponse(session: SessionUser) {
  return {
    user: { id: session.userId, email: session.email },
    profile: {
      role: session.role,
      full_name: session.fullName,
      email: session.email,
    },
  };
}
