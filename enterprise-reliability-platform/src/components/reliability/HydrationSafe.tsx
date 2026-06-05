"use client";

import React, { useState, useEffect, ReactNode } from "react";

export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

interface HydrationSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * HydrationSafe component prevents server/client hydration mismatches.
 * It renders the fallback UI on the server, and swaps in the actual client content
 * after mounting is successfully completed.
 */
export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
