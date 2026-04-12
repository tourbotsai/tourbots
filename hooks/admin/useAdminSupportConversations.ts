import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SupportConversation, SupportMessage } from '@/lib/types';

export function useAdminSupportConversations() {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(`/api/admin/help/conversations?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations');
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
        description: error.message || 'Failed to load support conversations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [activeConversationId, searchTerm, statusFilter, toast]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/help/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
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
  }, [toast]);

  const sendAdminMessage = useCallback(async (conversationId: string, message: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/help/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
              ? { ...conversation, last_message_at: newMessage.created_at }
              : conversation
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );

      toast({
        title: 'Reply sent',
        description: 'Your admin reply has been posted to this conversation.',
      });

      return newMessage;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reply.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  return {
    conversations,
    messages,
    activeConversationId,
    searchTerm,
    statusFilter,
    isLoadingConversations,
    isLoadingMessages,
    isSubmitting,
    setSearchTerm,
    setStatusFilter,
    setActiveConversationId,
    fetchConversations,
    fetchMessages,
    sendAdminMessage,
  };
}
