"use client";

import { UserContext } from "@/contexts/user-context";
import { useUserStandalone } from "@/hooks/useUser";

/**
 * Resolves the signed-in user once and shares it with every `useUser()` caller
 * beneath it. Mount this in the persistent app layout so the resolved user
 * survives client-side navigation — pages and their AuthGuards then read the
 * already-resolved value instead of re-authenticating (and re-showing the
 * loading spinner) on every navigation.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const value = useUserStandalone(true);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
