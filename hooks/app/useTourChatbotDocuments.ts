import { useState, useCallback, useEffect } from 'react';
import { ChatbotDocument } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

function isAgencyPortalPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/embed/agency/');
}

function getAgencyShareSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const agencyIndex = parts.findIndex((part) => part === 'agency');
  if (agencyIndex === -1) return null;
  const candidate = parts[agencyIndex + 1];
  if (!candidate || candidate === 'preview') return null;
  return candidate;
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function useTourChatbotDocuments(chatbotConfigId?: string | null, tourId?: string | null) {
  const [documents, setDocuments] = useState<ChatbotDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchDocuments = useCallback(async () => {
    if (!chatbotConfigId) {
      setDocuments([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const url = isPortal
        ? `/api/public/agency-portal/documents?chatbotConfigId=${chatbotConfigId}${shareSlug ? `&shareSlug=${encodeURIComponent(shareSlug)}` : ''}`
        : `/api/app/chatbots/documents?venueId=${user?.venue?.id}&chatbotConfigId=${chatbotConfigId}`;
      const response = await fetch(url, { headers: isPortal ? {} : await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tour documents');
      }

      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, user?.venue?.id, getAuthHeaders]);

  // Auto-fetch documents when user/venue is available
  useEffect(() => {
    if (chatbotConfigId) {
      fetchDocuments();
    }
  }, [chatbotConfigId, fetchDocuments]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!chatbotConfigId || !tourId) {
      throw new Error('Chatbot configuration and tour are required');
    }

    const isPortal = isAgencyPortalPath();
    const shareSlug = getAgencyShareSlug();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatbotConfigId', chatbotConfigId);
    if (isPortal && shareSlug) {
      formData.append('shareSlug', shareSlug);
    } else {
      formData.append('venueId', user!.venue!.id);
      formData.append('tourId', tourId);
      formData.append('userId', user!.id);
    }
    
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch(isPortal ? '/api/public/agency-portal/documents' : '/api/app/chatbots/documents', {
        method: 'POST',
        headers: isPortal
          ? {
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      // Add new document to the list
      setDocuments(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [chatbotConfigId, tourId, user?.venue?.id, user?.id, getAuthHeaders]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!chatbotConfigId) {
      throw new Error('Chatbot configuration is required');
    }

    const isPortal = isAgencyPortalPath();
    const shareSlug = getAgencyShareSlug();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(isPortal ? '/api/public/agency-portal/documents' : '/api/app/chatbots/documents', {
        method: 'DELETE',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({
              'Content-Type': 'application/json',
            }),
        body: JSON.stringify(
          isPortal
            ? { documentId, shareSlug, chatbotConfigId }
            : { documentId, venueId: user!.venue!.id, chatbotConfigId }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tour document');
      }

      // Remove document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, user?.venue?.id, getAuthHeaders]);

  return {
    documents,
    isLoading,
    isUploading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
} 