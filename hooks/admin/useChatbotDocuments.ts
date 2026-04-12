import { useState, useCallback } from 'react';
import { ChatbotDocument } from '@/lib/types';

export function useChatbotDocuments() {
  const [documents, setDocuments] = useState<ChatbotDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (venueId?: string, chatbotType?: 'tour') => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/admin/chatbots/documents';
      const params = new URLSearchParams();
      
      if (venueId && venueId !== 'all') {
        params.append('venueId', venueId);
      }
      
      if (chatbotType) {
        params.append('chatbotType', chatbotType);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
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
  }, []);

  const uploadDocument = useCallback(async (file: File, venueId: string, userId: string, chatbotType?: 'tour') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('venueId', venueId);
    formData.append('userId', userId);
    if (chatbotType) {
      formData.append('chatbotType', chatbotType);
    }
    
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/chatbots/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      // Add new document to the list
      setDocuments(prev => [data.document, ...prev]);
      return data.document;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string, venueId?: string, chatbotType?: 'tour') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chatbots/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentId,
          venueId 
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
  }, []);

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