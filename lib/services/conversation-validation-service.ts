import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export class ConversationValidationService {
  /**
   * Get simple conversation statistics
   */
  static async getConversationStats(): Promise<{
    total: number;
    realConversations: number;
    fakeConversations: number;
    realPercentage: number;
    byType: Record<string, { total: number; real: number; fake: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('conversation_id, message_type, chatbot_type');

      if (error || !data) {
        console.error('Error fetching conversation stats:', error);
        return {
          total: 0,
          realConversations: 0,
          fakeConversations: 0,
          realPercentage: 0,
          byType: {}
        };
      }

      // Group by conversation_id
      const conversationMap = new Map<string, { messageTypes: string[]; chatbotType: string }>();
      data.forEach(conv => {
        if (!conversationMap.has(conv.conversation_id)) {
          conversationMap.set(conv.conversation_id, {
            messageTypes: [],
            chatbotType: conv.chatbot_type || 'unknown'
          });
        }
        conversationMap.get(conv.conversation_id)!.messageTypes.push(conv.message_type);
      });

      let realConversations = 0;
      let fakeConversations = 0;
      const byType: Record<string, { total: number; real: number; fake: number }> = {};

      conversationMap.forEach((conv, conversationId) => {
        const hasVisitorMessage = conv.messageTypes.some(type => type === 'visitor');
        const chatbotType = conv.chatbotType;

        if (!byType[chatbotType]) {
          byType[chatbotType] = { total: 0, real: 0, fake: 0 };
        }

        byType[chatbotType].total++;

        if (hasVisitorMessage) {
          realConversations++;
          byType[chatbotType].real++;
        } else {
          fakeConversations++;
          byType[chatbotType].fake++;
        }
      });

      const total = realConversations + fakeConversations;
      const realPercentage = total > 0 ? Math.round((realConversations / total) * 100 * 100) / 100 : 0;

      return {
        total,
        realConversations,
        fakeConversations,
        realPercentage,
        byType
      };

    } catch (error: any) {
      console.error('Error getting conversation stats:', error);
      return {
        total: 0,
        realConversations: 0,
        fakeConversations: 0,
        realPercentage: 0,
        byType: {}
      };
    }
  }
} 