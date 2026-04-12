import { useCallback } from 'react';
import { useAuth } from 'reactfire';

export function useAuthHeaders() {
  const auth = useAuth();

  const getAuthHeaders = useCallback(async (baseHeaders: HeadersInit = {}) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/embed/agency')) {
        return {
          ...baseHeaders,
        };
      }
      throw new Error('User not authenticated');
    }

    const token = await currentUser.getIdToken();

    return {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
    };
  }, [auth]);

  return { getAuthHeaders };
}

