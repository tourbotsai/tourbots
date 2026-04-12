import { NextRequest, NextResponse } from 'next/server';
import { 
  customisationPresets, 
  getPresetByName, 
  applyPreset,
  getPresetsByCategory,
  getPresetsByTags,
  mergePresets,
  generateCoordinatedCustomisation
} from '@/lib/chatbot-customisation-service';
import { getChatbotCustomisation } from '@/lib/server/chatbot-customisation-db';
import {
  authenticateChatbotRoute,
  ensureTourScope,
  ensureVenueScope,
  getScopedVenueId,
} from '@/lib/chatbot-route-auth';

export const dynamic = 'force-dynamic';

// GET /api/app/chatbots/customisation/presets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const presetName = searchParams.get('name');

    // Return specific preset by name
    if (presetName) {
      const preset = getPresetByName(presetName);
      if (!preset) {
        return NextResponse.json(
          { error: 'Preset not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(preset);
    }

    // Filter by category
    if (category) {
      const validCategories = ['modern', 'professional', 'playful', 'minimal', 'corporate'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be: ' + validCategories.join(', ') },
          { status: 400 }
        );
      }
      
      const categoryPresets = getPresetsByCategory(category as any);
      return NextResponse.json({
        presets: categoryPresets,
        category,
        count: categoryPresets.length
      });
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      const taggedPresets = getPresetsByTags(tagArray);
      return NextResponse.json({
        presets: taggedPresets,
        tags: tagArray,
        count: taggedPresets.length
      });
    }

    // Return all presets
    return NextResponse.json({
      presets: customisationPresets,
      categories: ['modern', 'professional', 'playful', 'minimal', 'corporate'],
      count: customisationPresets.length
    });
  } catch (error: any) {
    console.error('Error fetching customisation presets:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch customisation presets' },
      { status: 500 }
    );
  }
}

// POST /api/app/chatbots/customisation/presets
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { action, presetName, presetNames, venueId: requestedVenueId, tourId, chatbotType, primaryColour } = body;
    const resolvedChatbotType = chatbotType || 'tour';
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, requestedVenueId || null);

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Apply single preset
    if (action === 'apply' && presetName && scopedVenueId && tourId) {
      const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
      if (tourScopeError) return tourScopeError;
      if (resolvedChatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Must be "tour" or omitted' },
          { status: 400 }
        );
      }

      // Get current customisation
      const currentCustomisation = await getChatbotCustomisation(scopedVenueId, resolvedChatbotType, tourId);
      if (!currentCustomisation) {
        return NextResponse.json(
          { error: 'Customisation not found for this venue and chatbot type' },
          { status: 404 }
        );
      }

      // Apply preset
      const updatedCustomisation = applyPreset(currentCustomisation, presetName);
      return NextResponse.json({
        success: true,
        customisation: updatedCustomisation,
        appliedPreset: presetName
      });
    }

    // Merge multiple presets
    if (action === 'merge' && presetNames && Array.isArray(presetNames) && scopedVenueId && tourId) {
      const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
      if (tourScopeError) return tourScopeError;
      if (resolvedChatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Must be "tour" or omitted' },
          { status: 400 }
        );
      }

      if (presetNames.length === 0) {
        return NextResponse.json(
          { error: 'At least one preset name is required' },
          { status: 400 }
        );
      }

      if (presetNames.length > 5) {
        return NextResponse.json(
          { error: 'Maximum 5 presets can be merged at once' },
          { status: 400 }
        );
      }

      // Validate all preset names exist
      for (const name of presetNames) {
        if (!getPresetByName(name)) {
          return NextResponse.json(
            { error: `Preset "${name}" not found` },
            { status: 400 }
          );
        }
      }

      // Get current customisation
      const currentCustomisation = await getChatbotCustomisation(scopedVenueId, resolvedChatbotType, tourId);
      if (!currentCustomisation) {
        return NextResponse.json(
          { error: 'Customisation not found for this venue and chatbot type' },
          { status: 404 }
        );
      }

      // Merge presets
      const mergedCustomisation = mergePresets(currentCustomisation, presetNames);
      return NextResponse.json({
        success: true,
        customisation: mergedCustomisation,
        mergedPresets: presetNames
      });
    }

    // Generate colour-coordinated customisation
    if (action === 'generate-coordinated' && primaryColour && scopedVenueId && tourId) {
      const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
      if (tourScopeError) return tourScopeError;
      if (resolvedChatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Must be "tour" or omitted' },
          { status: 400 }
        );
      }

      // Validate hex colour format
      const hexColourPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColourPattern.test(primaryColour)) {
        return NextResponse.json(
          { error: 'Invalid colour format. Use hex format (e.g., #FF0000)' },
          { status: 400 }
        );
      }

      // Get current customisation
      const currentCustomisation = await getChatbotCustomisation(scopedVenueId, resolvedChatbotType, tourId);
      if (!currentCustomisation) {
        return NextResponse.json(
          { error: 'Customisation not found for this venue and chatbot type' },
          { status: 404 }
        );
      }

      // Generate coordinated colours
      const coordinatedCustomisation = generateCoordinatedCustomisation(currentCustomisation, primaryColour);
      return NextResponse.json({
        success: true,
        customisation: {
          ...currentCustomisation,
          ...coordinatedCustomisation
        },
        primaryColour,
        message: 'Colour-coordinated customisation generated successfully'
      });
    }

    // Preview preset (without applying)
    if (action === 'preview' && presetName) {
      const preset = getPresetByName(presetName);
      if (!preset) {
        return NextResponse.json(
          { error: 'Preset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        preset,
        preview: preset.customisation
      });
    }

    // Get preset suggestions based on current customisation
    if (action === 'suggest' && scopedVenueId && tourId) {
      const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
      if (tourScopeError) return tourScopeError;
      if (resolvedChatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Must be "tour" or omitted' },
          { status: 400 }
        );
      }

      // Get current customisation
      const currentCustomisation = await getChatbotCustomisation(scopedVenueId, resolvedChatbotType, tourId);
      if (!currentCustomisation) {
        return NextResponse.json(
          { error: 'Customisation not found for this venue and chatbot type' },
          { status: 404 }
        );
      }

      // Simple suggestion logic based on current settings
      let suggestedPresets = [...customisationPresets];

      // If animations are disabled, suggest presets with minimal animation
      if (!currentCustomisation.enable_animations) {
        suggestedPresets = suggestedPresets.filter(preset => 
          !preset.customisation.enable_animations || 
          preset.customisation.animation_speed === 'slow'
        );
      }

      // If using sharp corners, suggest professional presets
      if (currentCustomisation.chat_button_border_radius && currentCustomisation.chat_button_border_radius <= 10) {
        suggestedPresets = suggestedPresets.filter(preset => 
          preset.category === 'professional' || preset.category === 'corporate'
        );
      }

      // If using rounded corners, suggest modern/playful presets
      if (currentCustomisation.chat_button_border_radius && currentCustomisation.chat_button_border_radius >= 30) {
        suggestedPresets = suggestedPresets.filter(preset => 
          preset.category === 'modern' || preset.category === 'playful'
        );
      }

      // Limit to top 3 suggestions
      const topSuggestions = suggestedPresets.slice(0, 3);

      return NextResponse.json({
        success: true,
        suggestions: topSuggestions,
        count: topSuggestions.length,
        basedOn: {
          animations: currentCustomisation.enable_animations,
          borderRadius: currentCustomisation.chat_button_border_radius,
          chatbotType: resolvedChatbotType
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: apply, merge, generate-coordinated, preview, suggest' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing preset action:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process preset action' },
      { status: 500 }
    );
  }
}

// PUT /api/app/chatbots/customisation/presets (for potential future custom preset creation)
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Custom preset creation not yet implemented' },
    { status: 501 }
  );
}

// DELETE /api/app/chatbots/customisation/presets (for potential future custom preset deletion)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Custom preset deletion not yet implemented' },
    { status: 501 }
  );
} 