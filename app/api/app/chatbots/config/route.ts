import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import {
  authenticateChatbotRoute,
  getScopedVenueId,
  ensureTourScope,
  ensureVenueScope,
  getScopedChatbotConfig,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import {
  getAdvancedDefaultCustomisation,
} from '@/lib/chatbot-customisation-service';
import {
  getChatbotCustomisation,
  upsertChatbotCustomisation,
} from '@/lib/server/chatbot-customisation-db';

const DEFAULT_TOUR_CHATBOT_NAME = 'Tour Assistant';
const DEFAULT_TOUR_GUARDRAIL_PROMPT =
  'You are an AI assistant for this virtual tour. Only answer questions about this location, its spaces, and the virtual tour experience. If a question is unrelated, politely explain that you can only help with tour and location questions.';
const DEFAULT_TOUR_INSTRUCTION_PROMPT =
  'Guide visitors through the virtual tour clearly and concisely. Focus on what they can see in this location and help them navigate the space.';

function textOrDefault(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const tourId = searchParams.get('tourId');
    const chatbotType = searchParams.get('chatbotType');
    const venueId = getScopedVenueId(authResult, requestedVenueId);

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;

    if (chatbotType && chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Must be "tour" or omitted' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('chatbot_configs')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    query = query.eq('venue_id', venueId);

    if (tourId) {
      const tourScopeError = await ensureTourScope(venueId, tourId);
      if (tourScopeError) return tourScopeError;
      query = query.eq('tour_id', tourId);
    }

    if (chatbotType === 'tour') {
      query = query.eq('chatbot_type', 'tour');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (tourId) {
      return NextResponse.json((data && data[0]) || null);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching chatbot configs:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot configs' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { configId, updates } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID is required' },
        { status: 400 }
      );
    }

    const existingConfig = await getScopedChatbotConfig(configId, authResult.venueId);
    if (!existingConfig) {
      return NextResponse.json({ error: 'Chatbot config not found for venue' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chatbot_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logChatbotAudit('chatbot_config_updated', authResult, { config_id: configId });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating chatbot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId: requestedVenueId, tourId, config } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId);
    if (!tourId) {
      return NextResponse.json(
        { error: 'Tour ID is required' },
        { status: 400 }
      );
    }

    const tourScopeError = await ensureTourScope(venueId, tourId);
    if (tourScopeError) return tourScopeError;

    // Get venue information for vector store naming
    const { data: venueRow, error: venueFetchError } = await supabase
      .from('venues')
      .select('name')
      .eq('id', venueId)
      .single();

    if (venueFetchError || !venueRow) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Tour chatbot only
    const chatbotType = 'tour' as const;
    
    // Create vector store in OpenAI with descriptive name
    const vectorStoreName = `${venueRow.name} - Virtual Tour Chatbot`;
    
    let vectorStoreId = null;
    try {
      const vectorStore = await openAIService.createVectorStore(vectorStoreName);
      vectorStoreId = vectorStore.id;
      console.log(`Created vector store: ${vectorStoreName} (${vectorStoreId})`);
    } catch (openAIError: any) {
      console.error('Failed to create vector store:', openAIError);
      // Continue without vector store for now - can be created later
    }

    const incomingConfig = config || {};
    const configData = {
      venue_id: venueId,
      tour_id: tourId,
      chatbot_type: chatbotType,
      openai_vector_store_id: vectorStoreId,
      ...incomingConfig,
      chatbot_name: textOrDefault(incomingConfig.chatbot_name, DEFAULT_TOUR_CHATBOT_NAME),
      instruction_prompt: textOrDefault(incomingConfig.instruction_prompt, DEFAULT_TOUR_INSTRUCTION_PROMPT),
      guardrail_prompt: textOrDefault(incomingConfig.guardrail_prompt, DEFAULT_TOUR_GUARDRAIL_PROMPT),
      guardrails_enabled:
        typeof incomingConfig.guardrails_enabled === 'boolean'
          ? incomingConfig.guardrails_enabled
          : true,
      is_active:
        typeof incomingConfig.is_active === 'boolean'
          ? incomingConfig.is_active
          : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('chatbot_configs')
      .insert([configData])
      .select()
      .single();

    if (error) {
      // If database insert fails but vector store was created, clean up
      if (vectorStoreId) {
        try {
          await openAIService.deleteVectorStore(vectorStoreId);
        } catch (cleanupError) {
          console.error('Failed to cleanup vector store:', cleanupError);
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Seed per-tour customisation row on config creation (if missing).
    // This keeps each tour location isolated and ready immediately.
    try {
      const existingCustomisation = await getChatbotCustomisation(venueId, 'tour', tourId);
      if (!existingCustomisation) {
        await upsertChatbotCustomisation(
          venueId,
          'tour',
          tourId,
          getAdvancedDefaultCustomisation('tour')
        );
      }
    } catch (seedError) {
      // Non-blocking: config creation has succeeded, so keep UX smooth.
      console.error('Failed to seed chatbot customisation for new config:', seedError);
    }

    logChatbotAudit('chatbot_config_created', authResult, { config_id: data.id, tour_id: tourId });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating chatbot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot config' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { configId } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Get config first to clean up vector store
    const config = await getScopedChatbotConfig(configId, authResult.venueId);
    if (!config) {
      return NextResponse.json({ error: 'Chatbot config not found for venue' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chatbot_configs')
      .delete()
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up vector store if it exists
    if (config.openai_vector_store_id) {
      try {
        await openAIService.deleteVectorStore(config.openai_vector_store_id);
        console.log(`Deleted vector store: ${config.openai_vector_store_id}`);
      } catch (cleanupError) {
        console.error('Failed to cleanup vector store:', cleanupError);
      }
    }

    logChatbotAudit('chatbot_config_deleted', authResult, { config_id: configId });
    return NextResponse.json({ success: true, deletedConfig: data });
  } catch (error: any) {
    console.error('Error deleting chatbot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete chatbot config' },
      { status: 500 }
    );
  }
}

// PATCH method to create vector stores for existing configs
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { configId, action } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID is required' },
        { status: 400 }
      );
    }

    if (action === 'create-vector-store') {
      // Get config and venue info
      const { data: config, error: configError } = await supabase
        .from('chatbot_configs')
        .select(`
          *,
          venues (
            id,
            name
          )
        `)
        .eq('id', configId)
        .single();

      if (configError || !config) {
        return NextResponse.json(
          { error: 'Config not found' },
          { status: 404 }
        );
      }

      if (config.venue_id !== authResult.venueId) {
        return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
      }

      if (config.openai_vector_store_id) {
        return NextResponse.json({
          message: 'Vector store already exists',
          vectorStoreId: config.openai_vector_store_id
        });
      }

      // Create vector store
      const vectorStoreName = `${config.venues.name} - Virtual Tour Chatbot`;
      
      try {
        const vectorStore = await openAIService.createVectorStore(vectorStoreName);
        
        // Update config with vector store ID
        const { data: updatedConfig, error: updateError } = await supabase
          .from('chatbot_configs')
          .update({
            openai_vector_store_id: vectorStore.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', configId)
          .select()
          .single();

        if (updateError) {
          // Clean up vector store if database update fails
          await openAIService.deleteVectorStore(vectorStore.id);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        console.log(`Created vector store: ${vectorStoreName} (${vectorStore.id})`);
        logChatbotAudit('chatbot_vector_store_created', authResult, { config_id: configId });
        return NextResponse.json({
          message: 'Vector store created successfully',
          vectorStoreId: vectorStore.id,
          config: updatedConfig
        });
      } catch (openAIError: any) {
        console.error('Failed to create vector store:', openAIError);
        return NextResponse.json(
          { error: `Failed to create vector store: ${openAIError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in PATCH method:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 