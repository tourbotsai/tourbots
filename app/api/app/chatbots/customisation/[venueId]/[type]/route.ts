import { NextRequest, NextResponse } from 'next/server';
import { 
  getAdvancedDefaultCustomisation,
  validateCustomisation
} from '@/lib/chatbot-customisation-service';
import {
  getChatbotCustomisation,
  upsertChatbotCustomisation,
  deleteChatbotCustomisation,
} from '@/lib/server/chatbot-customisation-db';
import {
  authenticateChatbotRoute,
  ensureTourScope,
  ensureVenueScope,
  getScopedVenueId,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { venueId: string; type: string } }
) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, type } = await (params as any);
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);

    if (!venueId || !type) {
      return NextResponse.json(
        { error: 'Venue ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (type !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    if (!tourId) {
      return NextResponse.json(
        { error: 'Tour ID is required' },
        { status: 400 }
      );
    }

    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    const customisation = await getChatbotCustomisation(scopedVenueId, 'tour', tourId);
    
    if (!customisation) {
      // Return advanced defaults instead of error
      const defaultCustomisation = getAdvancedDefaultCustomisation('tour');
      return NextResponse.json({
        ...defaultCustomisation,
        id: '',
        venue_id: scopedVenueId,
        tour_id: tourId,
        chatbot_type: 'tour',
        created_at: '',
        updated_at: '',
        is_default: true, // Flag to indicate this is default data
      });
    }

    return NextResponse.json(customisation);
  } catch (error: any) {
    console.error('Error fetching chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { venueId: string; type: string } }
) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, type } = await (params as any);
    const body = await request.json();
    const tourId = body?.tour_id;
    const customisation = body;
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !type || !tourId) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (type !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    // Validate customisation data
    const validation = validateCustomisation(customisation);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid customisation data',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Additional field-specific validation
    if (customisation.font_family && typeof customisation.font_family !== 'string') {
      return NextResponse.json(
        { error: 'Font family must be a string' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validAnimationSpeeds = ['slow', 'normal', 'fast'];
    if (customisation.animation_speed && !validAnimationSpeeds.includes(customisation.animation_speed)) {
      return NextResponse.json(
        { error: 'Animation speed must be slow, normal, or fast' },
        { status: 400 }
      );
    }
    
    // MOBILE ANIMATION SPEED VALIDATION
    if (customisation.mobile_animation_speed && !validAnimationSpeeds.includes(customisation.mobile_animation_speed)) {
      return NextResponse.json(
        { error: 'Mobile animation speed must be slow, normal, or fast' },
        { status: 400 }
      );
    }

    const validShadowIntensities = ['none', 'light', 'medium', 'heavy'];
    if (customisation.chat_button_shadow_intensity && !validShadowIntensities.includes(customisation.chat_button_shadow_intensity)) {
      return NextResponse.json(
        { error: 'Shadow intensity must be none, light, medium, or heavy' },
        { status: 400 }
      );
    }
    
    // MOBILE SHADOW INTENSITY VALIDATION
    if (customisation.mobile_chat_button_shadow_intensity && !validShadowIntensities.includes(customisation.mobile_chat_button_shadow_intensity)) {
      return NextResponse.json(
        { error: 'Mobile chat button shadow intensity must be none, light, medium, or heavy' },
        { status: 400 }
      );
    }
    
    if (customisation.mobile_chat_window_shadow_intensity && !validShadowIntensities.includes(customisation.mobile_chat_window_shadow_intensity)) {
      return NextResponse.json(
        { error: 'Mobile chat window shadow intensity must be none, light, medium, or heavy' },
        { status: 400 }
      );
    }

    const validEntranceAnimations = ['slide-up', 'slide-down', 'fade-in', 'scale-up', 'none'];
    if (customisation.chat_entrance_animation && !validEntranceAnimations.includes(customisation.chat_entrance_animation)) {
      return NextResponse.json(
        { error: 'Invalid entrance animation type' },
        { status: 400 }
      );
    }
    
    // MOBILE ENTRANCE ANIMATION VALIDATION
    if (customisation.mobile_chat_entrance_animation && !validEntranceAnimations.includes(customisation.mobile_chat_entrance_animation)) {
      return NextResponse.json(
        { error: 'Invalid mobile entrance animation type' },
        { status: 400 }
      );
    }

    const validMessageAnimations = ['fade-in', 'slide-in', 'scale-in', 'none'];
    if (customisation.message_animation && !validMessageAnimations.includes(customisation.message_animation)) {
      return NextResponse.json(
        { error: 'Invalid message animation type' },
        { status: 400 }
      );
    }
    
    // MOBILE MESSAGE ANIMATION VALIDATION
    if (customisation.mobile_message_animation && !validMessageAnimations.includes(customisation.mobile_message_animation)) {
      return NextResponse.json(
        { error: 'Invalid mobile message animation type' },
        { status: 400 }
      );
    }

    const validHoverEffects = ['scale', 'glow', 'lift', 'none'];
    if (customisation.button_hover_effect && !validHoverEffects.includes(customisation.button_hover_effect)) {
      return NextResponse.json(
        { error: 'Invalid button hover effect' },
        { status: 400 }
      );
    }
    
    // MOBILE HOVER EFFECT VALIDATION
    if (customisation.mobile_button_hover_effect && !validHoverEffects.includes(customisation.mobile_button_hover_effect)) {
      return NextResponse.json(
        { error: 'Invalid mobile button hover effect' },
        { status: 400 }
      );
    }

    const validFontWeights = ['light', 'normal', 'medium', 'bold'];
    if (customisation.message_font_weight && !validFontWeights.includes(customisation.message_font_weight)) {
      return NextResponse.json(
        { error: 'Invalid message font weight' },
        { status: 400 }
      );
    }

    if (customisation.header_font_weight && !validFontWeights.includes(customisation.header_font_weight)) {
      return NextResponse.json(
        { error: 'Invalid header font weight' },
        { status: 400 }
      );
    }
    
    // MOBILE FONT WEIGHT VALIDATION
    if (customisation.mobile_message_font_weight && !validFontWeights.includes(customisation.mobile_message_font_weight)) {
      return NextResponse.json(
        { error: 'Invalid mobile message font weight' },
        { status: 400 }
      );
    }
    
    if (customisation.mobile_header_font_weight && !validFontWeights.includes(customisation.mobile_header_font_weight)) {
      return NextResponse.json(
        { error: 'Invalid mobile header font weight' },
        { status: 400 }
      );
    }

    const validTimestampFormats = ['12h', '24h', 'relative'];
    if (customisation.timestamp_format && !validTimestampFormats.includes(customisation.timestamp_format)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }
    
    // MOBILE TIMESTAMP FORMAT VALIDATION
    if (customisation.mobile_timestamp_format && !validTimestampFormats.includes(customisation.mobile_timestamp_format)) {
      return NextResponse.json(
        { error: 'Invalid mobile timestamp format' },
        { status: 400 }
      );
    }

    const validAvatarStyles = ['circle', 'square', 'rounded'];
    if (customisation.avatar_style && !validAvatarStyles.includes(customisation.avatar_style)) {
      return NextResponse.json(
        { error: 'Invalid avatar style' },
        { status: 400 }
      );
    }
    
    // MOBILE AVATAR STYLE VALIDATION
    if (customisation.mobile_avatar_style && !validAvatarStyles.includes(customisation.mobile_avatar_style)) {
      return NextResponse.json(
        { error: 'Invalid mobile avatar style' },
        { status: 400 }
      );
    }

    const validSendButtonStyles = ['icon', 'text', 'icon-text'];
    if (customisation.send_button_style && !validSendButtonStyles.includes(customisation.send_button_style)) {
      return NextResponse.json(
        { error: 'Invalid send button style' },
        { status: 400 }
      );
    }
    
    // MOBILE SEND BUTTON STYLE VALIDATION
    if (customisation.mobile_send_button_style && !validSendButtonStyles.includes(customisation.mobile_send_button_style)) {
      return NextResponse.json(
        { error: 'Invalid mobile send button style' },
        { status: 400 }
      );
    }

    const validSendButtonIcons = ['Send', 'ArrowRight', 'ChevronRight', 'Play', 'MessageCircle'];
    if (customisation.send_button_icon && !validSendButtonIcons.includes(customisation.send_button_icon)) {
      return NextResponse.json(
        { error: 'Invalid send button icon' },
        { status: 400 }
      );
    }
    
    // MOBILE SEND BUTTON ICON VALIDATION
    if (customisation.mobile_send_button_icon && !validSendButtonIcons.includes(customisation.mobile_send_button_icon)) {
      return NextResponse.json(
        { error: 'Invalid mobile send button icon' },
        { status: 400 }
      );
    }

    const validTypingIndicatorStyles = ['dots', 'wave', 'pulse', 'none'];
    if (customisation.typing_indicator_style && !validTypingIndicatorStyles.includes(customisation.typing_indicator_style)) {
      return NextResponse.json(
        { error: 'Invalid typing indicator style' },
        { status: 400 }
      );
    }
    
    // MOBILE TYPING INDICATOR STYLE VALIDATION
    if (customisation.mobile_typing_indicator_style && !validTypingIndicatorStyles.includes(customisation.mobile_typing_indicator_style)) {
      return NextResponse.json(
        { error: 'Invalid mobile typing indicator style' },
        { status: 400 }
      );
    }
    
    // MOBILE TYPING INDICATOR SPEED VALIDATION
    if (customisation.mobile_typing_indicator_speed && !validAnimationSpeeds.includes(customisation.mobile_typing_indicator_speed)) {
      return NextResponse.json(
        { error: 'Mobile typing indicator speed must be slow, normal, or fast' },
        { status: 400 }
      );
    }
    
    // MOBILE TYPING INDICATOR ANIMATION VALIDATION
    if (customisation.mobile_typing_indicator_animation && !validTypingIndicatorStyles.includes(customisation.mobile_typing_indicator_animation)) {
      return NextResponse.json(
        { error: 'Invalid mobile typing indicator animation' },
        { status: 400 }
      );
    }

    const validLoadingSpinnerStyles = ['dots', 'circle', 'bars', 'pulse'];
    if (customisation.loading_spinner_style && !validLoadingSpinnerStyles.includes(customisation.loading_spinner_style)) {
      return NextResponse.json(
        { error: 'Invalid loading spinner style' },
        { status: 400 }
      );
    }
    
    // MOBILE LOADING SPINNER STYLE VALIDATION
    if (customisation.mobile_loading_spinner_style && !validLoadingSpinnerStyles.includes(customisation.mobile_loading_spinner_style)) {
      return NextResponse.json(
        { error: 'Invalid mobile loading spinner style' },
        { status: 400 }
      );
    }
    
    // MOBILE LOADING ANIMATION VALIDATION
    const validLoadingAnimations = ['spinner', 'dots', 'bars'];
    if (customisation.mobile_loading_animation && !validLoadingAnimations.includes(customisation.mobile_loading_animation)) {
      return NextResponse.json(
        { error: 'Invalid mobile loading animation' },
        { status: 400 }
      );
    }
    
    // MOBILE CHAT BUTTON ANIMATION VALIDATION
    const validChatButtonAnimations = ['none', 'bounce', 'pulse', 'shake', 'glow'];
    if (customisation.mobile_chat_button_animation && !validChatButtonAnimations.includes(customisation.mobile_chat_button_animation)) {
      return NextResponse.json(
        { error: 'Invalid mobile chat button animation' },
        { status: 400 }
      );
    }
    
    // MOBILE IDLE ANIMATION TYPE VALIDATION
    const validIdleAnimationTypes = ['bounce', 'pulse', 'shake', 'glow', 'none'];
    if (customisation.mobile_idle_animation_type && !validIdleAnimationTypes.includes(customisation.mobile_idle_animation_type)) {
      return NextResponse.json(
        { error: 'Invalid mobile idle animation type' },
        { status: 400 }
      );
    }
    
    // MOBILE BUTTON SIZE VALIDATION
    const validButtonSizes = ['small', 'medium', 'large'];
    if (customisation.mobile_send_button_size && !validButtonSizes.includes(customisation.mobile_send_button_size)) {
      return NextResponse.json(
        { error: 'Invalid mobile send button size' },
        { status: 400 }
      );
    }

    // Validate colour format (basic hex validation)
    const colourFields = [
      'chat_button_color', 'header_background_color', 'header_text_color',
      'user_message_background', 'user_message_text_color', 'ai_message_background',
      'ai_message_text_color', 'input_background_color', 'send_button_color',
      'send_button_icon_color', 'send_button_hover_color', 'chat_button_hover_color',
      'typing_indicator_color', 'loading_spinner_color', 'loading_text_color',
      'loading_background_color', 'mobile_chat_button_color', 'mobile_header_background_color',
      'mobile_header_text_color', 'mobile_ai_message_background', 'mobile_ai_message_text_color',
      'mobile_user_message_background', 'mobile_input_background_color', 'mobile_send_button_color'
    ];

    const hexColourPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (const field of colourFields) {
      if (customisation[field] && !hexColourPattern.test(customisation[field])) {
        return NextResponse.json(
          { error: `Invalid colour format for ${field}. Use hex format (e.g., #FF0000)` },
          { status: 400 }
        );
      }
    }

    // Validate URL format for custom avatar URLs
    if (customisation.custom_bot_avatar_url && customisation.custom_bot_avatar_url.trim()) {
      try {
        new URL(customisation.custom_bot_avatar_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format for custom bot avatar' },
          { status: 400 }
        );
      }
    }

    if (customisation.custom_user_avatar_url && customisation.custom_user_avatar_url.trim()) {
      try {
        new URL(customisation.custom_user_avatar_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format for custom user avatar' },
          { status: 400 }
        );
      }
    }

    if (customisation.custom_logo_url && customisation.custom_logo_url.trim()) {
      try {
        new URL(customisation.custom_logo_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format for custom logo' },
          { status: 400 }
        );
      }
    }

    const updatedCustomisation = await upsertChatbotCustomisation(
      scopedVenueId,
      'tour',
      tourId,
      customisation
    );

    logChatbotAudit('chatbot_customisation_updated', authResult, { tour_id: tourId });
    return NextResponse.json(updatedCustomisation);
  } catch (error: any) {
    console.error('Error updating chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { venueId: string; type: string } }
) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, type } = await (params as any);
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !type || !tourId) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (type !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    await deleteChatbotCustomisation(scopedVenueId, 'tour', tourId);

    logChatbotAudit('chatbot_customisation_deleted', authResult, { tour_id: tourId });
    return NextResponse.json({ 
      success: true,
      message: `${type} chatbot customisation deleted successfully`
    });
  } catch (error: any) {
    console.error('Error deleting chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete chatbot customisation' },
      { status: 500 }
    );
  }
} 