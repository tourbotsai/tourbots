import { useState, useEffect, useCallback } from 'react';
import { TourMenuSettings, TourMenuBlock } from '@/lib/types';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

interface UseTourMenuReturn {
  settings: TourMenuSettings | null;
  blocks: TourMenuBlock[];
  isLoading: boolean;
  error: string | null;
  saveMenu: (settings: Partial<TourMenuSettings>, blocks: TourMenuBlock[]) => Promise<void>;
  updateSettings: (updates: Partial<TourMenuSettings>) => Promise<void>;
  addBlock: (block: Omit<TourMenuBlock, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBlock: (blockId: string, updates: Partial<TourMenuBlock>) => void;
  deleteBlock: (blockId: string) => void;
  reorderBlocks: (blocks: TourMenuBlock[]) => void;
}

function isAgencyPortalPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/embed/agency/');
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function useTourMenu(tourId: string): UseTourMenuReturn {
  const { getAuthHeaders } = useAuthHeaders();
  const [settings, setSettings] = useState<TourMenuSettings | null>(null);
  const [blocks, setBlocks] = useState<TourMenuBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu data
  const fetchMenu = useCallback(async () => {
    if (!tourId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isPortal = isAgencyPortalPath();
      let response = await fetch(`/api/app/tours/${tourId}/menu`, {
        headers: await getAuthHeaders(),
        credentials: isPortal ? 'include' : undefined,
      });

      // Fallback for unauthenticated portal preview mode.
      if (isPortal && (response.status === 401 || response.status === 403)) {
        response = await fetch(`/api/public/menu/${tourId}`, {
          credentials: 'include',
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch menu');
      }

      setSettings(data.settings);
      setBlocks(data.blocks || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tour menu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tourId, getAuthHeaders]);

  // Load menu on mount
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Save complete menu (settings + blocks)
  const saveMenu = useCallback(async (
    settingsUpdates: Partial<TourMenuSettings>,
    blocksToSave: TourMenuBlock[]
  ) => {
    try {
      const isPortal = isAgencyPortalPath();
      const response = await fetch(`/api/app/tours/${tourId}/menu`, {
        method: 'POST',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: isPortal ? 'include' : undefined,
        body: JSON.stringify({
          settings: settingsUpdates,
          blocks: blocksToSave
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to save menu');
      }

      // Refresh data after save
      await fetchMenu();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [tourId, fetchMenu, getAuthHeaders]);

  // Update only settings
  const updateSettings = useCallback(async (updates: Partial<TourMenuSettings>) => {
    try {
      const isPortal = isAgencyPortalPath();
      const response = await fetch(`/api/app/tours/${tourId}/menu`, {
        method: 'PUT',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: isPortal ? 'include' : undefined,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to update settings');
      }

      setSettings(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [tourId, getAuthHeaders]);

  // Add block (optimistic update)
  const addBlock = useCallback((block: Omit<TourMenuBlock, 'id' | 'created_at' | 'updated_at'>) => {
    const newBlock = {
      ...block,
      id: `temp-${Date.now()}`, // Temporary ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as TourMenuBlock;

    setBlocks(prev => [...prev, newBlock]);
  }, []);

  // Update block (optimistic update)
  const updateBlock = useCallback((blockId: string, updates: Partial<TourMenuBlock>) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  }, []);

  // Delete block (optimistic update)
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  }, []);

  // Reorder blocks
  const reorderBlocks = useCallback((newBlocks: TourMenuBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  return {
    settings,
    blocks,
    isLoading,
    error,
    saveMenu,
    updateSettings,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
  };
}

