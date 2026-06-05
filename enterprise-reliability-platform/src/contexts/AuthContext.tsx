"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthUser, UserProfile } from "@/lib/auth/types";

async function fetchAuthSession(): Promise<{
  user: AuthUser | null;
  profile: UserProfile | null;
}> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return { user: null, profile: null };
    const data = await res.json();
    return { user: data.user ?? null, profile: data.profile ?? null };
  } catch {
    return { user: null, profile: null };
  }
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const session = await fetchAuthSession();
    setUser(session.user);
    setProfile(session.profile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAuthSession()
      .then((session) => {
        if (cancelled) return;
        setUser(session.user);
        setProfile(session.profile);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
