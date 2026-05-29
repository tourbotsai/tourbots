import { createContext } from "react";
import type { User } from "firebase/auth";
import type { UserWithVenue } from "@/lib/types";

export interface UseUserResult {
  user: UserWithVenue | null;
  authUser: User | null | undefined;
  loading: boolean;
  error: string | null;
  updateUser: (fields: any) => Promise<any>;
  updateVenue: (fields: any) => Promise<any>;
}

/**
 * Shared user context. Populated by `UserProvider` (see components/user-provider.tsx)
 * and consumed by `useUser()` so the signed-in user is resolved once and reused
 * across client-side navigation instead of re-authenticating on every page.
 */
export const UserContext = createContext<UseUserResult | null>(null);
