import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'reactfire';
import { useToast } from '@/components/ui/use-toast';
import { SupportConversation, SupportMessage } from '@/lib/types';

interface CreateSupportConversationInput {
  name: string;
  email: string;
  phone?: string;
  venueName?: string;
  helpTopic: string;
  message: string;
}

export function useSupportConversations() {
  const auth = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [auth]);

  const fetchConversations = useCallback(async () => {
    if (!auth.currentUser) return;

    setIsLoadingConversations(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/app/help/conversations', { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch support conversations');
      }

      const nextConversations = data.conversations || [];
      setConversations(nextConversations);

      if (nextConversations.length === 0) {
        setActiveConversationId(null);
        setMessages([]);
        return;
      }

      if (!activeConversationId || !nextConversations.some((c: SupportConversation) => c.id === activeConversationId)) {
        setActiveConversationId(nextConversations[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load your support conversations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [activeConversationId, auth.currentUser, getAuthHeaders, toast]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!auth.currentUser) return;

    setIsLoadingMessages(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/app/help/conversations/${conversationId}/messages`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch support messages');
      }

      setMessages(data.messages || []);
      setActiveConversationId(conversationId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load conversation messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [auth.currentUser, getAuthHeaders, toast]);

  const createConversation = useCallback(async (payload: CreateSupportConversationInput) => {
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/app/help/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create support conversation');
      }

      const createdConversation = data.conversation as SupportConversation;
      const firstMessage = data.firstMessage as SupportMessage;
      setConversations((prev) => [createdConversation, ...prev]);
      setActiveConversationId(createdConversation.id);
      setMessages([firstMessage]);

      toast({
        title: 'Message sent',
        description: 'Your support conversation has been created.',
      });

      return createdConversation;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send support request.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getAuthHeaders, toast]);

  const sendMessage = useCallback(async (conversationId: string, message: string) => {
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/app/help/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const newMessage = data.message as SupportMessage;
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev
          .map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  last_message_at: newMessage.created_at,
                }
              : conversation
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );

      return newMessage;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send your message.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getAuthHeaders, toast]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/app/help/conversations/${conversationId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete conversation');
      }

      setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been removed.',
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conversation.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [activeConversationId, getAuthHeaders, toast]);

  useEffect(() => {
    if (!auth.currentUser) return;
    fetchConversations();
  }, [auth.currentUser, fetchConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  return {
    conversations,
    messages,
    activeConversationId,
    isLoadingConversations,
    isLoadingMessages,
    isSubmitting,
    setActiveConversationId,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    deleteConversation,
  };
}
