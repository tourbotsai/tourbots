import { useEffect, useState } from "react";
import { useUser as useFirebaseUser } from "reactfire";
import { UserWithVenue } from "@/lib/types";

const USER_CACHE_TTL_MS = 30_000;

type CachedUserState = {
  uid: string;
  user: UserWithVenue | null;
  error: string | null;
  cachedAt: number;
};

let cachedUserState: CachedUserState | null = null;
let inFlightUserRequest:
  | Promise<{ user: UserWithVenue | null; error: string | null }>
  | null = null;

async function fetchUserWithCache(
  uid: string,
  token: string,
  forceRefresh = false
): Promise<{ user: UserWithVenue | null; error: string | null }> {
  const now = Date.now();
  const hasFreshCache =
    !forceRefresh &&
    cachedUserState !== null &&
    cachedUserState.uid === uid &&
    now - cachedUserState.cachedAt < USER_CACHE_TTL_MS;

  if (hasFreshCache && cachedUserState) {
    return { user: cachedUserState.user, error: cachedUserState.error };
  }

  if (inFlightUserRequest) {
    return inFlightUserRequest;
  }

  inFlightUserRequest = (async () => {
    try {
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = payload?.error || "Failed to fetch user profile";
        cachedUserState = {
          uid,
          user: null,
          error,
          cachedAt: Date.now(),
        };
        return { user: null, error };
      }

      const user = (payload?.user as UserWithVenue) || null;
      cachedUserState = {
        uid,
        user,
        error: null,
        cachedAt: Date.now(),
      };
      return { user, error: null };
    } catch (err: any) {
      const error = err?.message || "Failed to fetch user profile";
      cachedUserState = {
        uid,
        user: null,
        error,
        cachedAt: Date.now(),
      };
      return { user: null, error };
    } finally {
      inFlightUserRequest = null;
    }
  })();

  return inFlightUserRequest;
}

export function useUser() {
  const { data: authUser, hasEmitted: firebaseLoaded } = useFirebaseUser();
  const [user, setUser] = useState<UserWithVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseLoaded) return;
    
    if (!authUser) {
      cachedUserState = null;
      inFlightUserRequest = null;
      setUser(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        const token = await authUser.getIdToken();
        const result = await fetchUserWithCache(authUser.uid, token);
        setUser(result.user);
        setError(result.error);
      } catch (err: any) {
        console.error('Error in useUser hook:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser, firebaseLoaded]);

  const updateUser = async (fields: any) => {
    if (!user) return null;
    
    try {
      const token = await authUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update user");
      }

      if (!authUser?.uid) {
        return payload?.user || null;
      }

      const refreshed = await fetchUserWithCache(authUser.uid, token, true);
      if (refreshed.user) {
        setUser(refreshed.user);
        setError(refreshed.error);
        return refreshed.user;
      }

      return payload?.user || null;
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const updateVenue = async (fields: any) => {
    if (!user?.venue) return null;
    
    try {
      const token = await authUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/venues/${user.venue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update venue");
      }

      if (!authUser?.uid) {
        return payload?.venue || null;
      }

      const refreshed = await fetchUserWithCache(authUser.uid, token, true);
      if (refreshed.user) {
        setUser(refreshed.user);
        setError(refreshed.error);
        return refreshed.user?.venue || null;
      }

      return payload?.venue || null;
    } catch (err: any) {
      console.error('Error updating venue:', err);
      throw err;
    }
  };

  return { 
    user, 
    authUser, 
    loading: loading || !firebaseLoaded, 
    error,
    updateUser, 
    updateVenue 
  };
} 