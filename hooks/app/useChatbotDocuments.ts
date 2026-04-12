import { useState, useCallback } from 'react';
import { ChatbotDocument } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useChatbotDocuments() {
  const [documents, setDocuments] = useState<ChatbotDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchDocuments = useCallback(async (chatbotType?: 'tour') => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/documents?venueId=${user.venue.id}`;
      if (chatbotType) {
        url += `&chatbotType=${chatbotType}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch documents');
      }

      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const uploadDocument = useCallback(async (file: File, chatbotType?: 'tour') => {
    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('venueId', user.venue.id);
    formData.append('userId', user.id);
    if (chatbotType) {
      formData.append('chatbotType', chatbotType);
    }
    
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/app/chatbots/documents', {
        method: 'POST',
        headers: await getAuthHeaders(),
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
  }, [user?.venue?.id, user?.id, getAuthHeaders]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/app/chatbots/documents', {
        method: 'DELETE',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ 
          documentId,
          venueId: user.venue.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }

      // Remove document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

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