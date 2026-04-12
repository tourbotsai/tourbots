import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'reactfire';
import { Guide } from '@/lib/types';

interface UseHelpGuidesState {
  guides: Guide[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
}

export function useHelpGuides() {
  const auth = useAuth();
  const [state, setState] = useState<UseHelpGuidesState>({
    guides: [],
    tags: [],
    isLoading: true,
    error: null,
  });
  const [search, setSearch] = useState<string | undefined>(undefined);

  const fetchGuides = useCallback(async () => {
    if (!auth.currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = await auth.currentUser.getIdToken();
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/app/help/guides${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch guides');
      }

      setState({
        guides: payload.guides || [],
        tags: payload.tags || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Failed to fetch guides',
      }));
    }
  }, [auth, search]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const updateFilters = useCallback((filters: { search?: string }) => {
    setSearch(filters.search?.trim() || undefined);
  }, []);

  return {
    guides: state.guides,
    tags: state.tags,
    isLoading: state.isLoading,
    error: state.error,
    updateFilters,
  };
}
