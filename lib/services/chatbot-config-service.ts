export interface ChatbotConfigResponse {
  chatbot_name: string;
  welcome_message: string;
  is_active: boolean;
  chatbot_type: 'tour';
  venue_name: string;
  venue_id: string;
}

export class ChatbotConfigService {
  /**
   * Fetch chatbot configuration WITHOUT storing any messages
   * Used for component initialization and config loading
   */
  static async getPublicConfig(
    venueId: string, 
    type: 'tour',
    tourId?: string,
    options: {
      embedId?: string;
      embedToken?: string;
    } = {}
  ): Promise<ChatbotConfigResponse> {
    const query = new URLSearchParams();
    query.set('type', type);
    if (tourId) query.set('tourId', tourId);
    if (options.embedId) query.set('embedId', options.embedId);
    if (options.embedToken) query.set('embedToken', options.embedToken);
    const response = await fetch(`/api/public/chatbot-config/${venueId}?${query.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch config');
    }
    
    return response.json();
  }

  /**
   * Fetch chatbot configuration for POST requests with embed tracking
   * Used when embed tracking and customisation data is needed
   */
  static async getPublicConfigWithTracking(
    venueId: string,
    type: 'tour',
    options: {
      embedId?: string;
      embedToken?: string;
      domain?: string;
      pageUrl?: string;
      sessionId?: string;
      conversationId?: string;
      getCustomisation?: boolean;
    } = {}
  ): Promise<any> {
    const response = await fetch(`/api/public/chatbot-config/${venueId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        ...options
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch config');
    }
    
    return response.json();
  }

  /**
   * Fetch chatbot configuration for authenticated users
   */
  static async getAppConfig(
    venueId: string, 
    type?: 'tour',
    tourId?: string
  ): Promise<ChatbotConfigResponse[]> {
    let url = `/api/app/chatbots/config?venueId=${venueId}`;
    if (type) {
      url += `&chatbotType=${type}`;
    }
    if (tourId) {
      url += `&tourId=${tourId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch configs');
    }
    
    return response.json();
  }
} 