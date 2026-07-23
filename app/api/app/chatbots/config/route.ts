import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
import { assertBotAvailable } from '@/lib/server/venue-bot-limits';

const DEFAULT_TOUR_CHATBOT_NAME = 'Tour Assistant';
const DEFAULT_TOUR_GUARDRAIL_PROMPT =
  'You are an AI assistant for this virtual tour. Only answer questions about this location, its spaces, and the virtual tour experience. If a question is unrelated, politely explain that you can only help with tour and location questions.';
const DEFAULT_TOUR_INSTRUCTION_PROMPT =
  'Guide visitors through the virtual tour clearly and concisely. Focus on what they can see in this location and help them navigate the space.';

const DEFAULT_WEBSITE_CHATBOT_NAME = 'Website Assistant';
const DEFAULT_WEBSITE_GUARDRAIL_PROMPT =
  'You are an AI assistant for this website. Only answer questions about this business, its services, and what is described on the website. If a question is unrelated, politely explain that you can only help with questions about the business.';
const DEFAULT_WEBSITE_INSTRUCTION_PROMPT =
  'Help website visitors clearly and concisely with questions about the business, its services, and how to get in touch. There is no virtual tour attached to this chatbot, so never offer to navigate or show tour areas.';

const nullableTextSetting = z.string().trim().max(10_000).nullable().optional();
const nullableLimitSetting = z.number().int().min(0).max(1_000_000).nullable().optional();

// Deliberately exclude identity, ownership, billing, and server-managed fields.
// They must always come from the authenticated request scope or server services.
const chatbotSettingsSchema = z.object({
  chatbot_name: z.string().trim().min(1).max(120).optional(),
  welcome_message: nullableTextSetting,
  personality_prompt: nullableTextSetting,
  instruction_prompt: nullableTextSetting,
  guardrails_enabled: z.boolean().nullable().optional(),
  guardrail_prompt: nullableTextSetting,
  is_active: z.boolean().optional(),
  rate_limit_requests_per_minute: nullableLimitSetting,
  rate_limit_requests_per_hour: nullableLimitSetting,
  rate_limit_requests_per_day: nullableLimitSetting,
  rate_limit_requests_per_week: nullableLimitSetting,
  rate_limit_requests_per_month: nullableLimitSetting,
  rate_limit_burst_limit: nullableLimitSetting,
  enable_rate_limiting: z.boolean().nullable().optional(),
  hard_limits_enabled: z.boolean().nullable().optional(),
  hard_limit_daily_messages: nullableLimitSetting,
  hard_limit_weekly_messages: nullableLimitSetting,
  hard_limit_monthly_messages: nullableLimitSetting,
  hard_limit_yearly_messages: nullableLimitSetting,
}).strict();

const createConfigRequestSchema = z.object({
  venueId: z.string().uuid().optional(),
  tourId: z.string().uuid().optional(),
  chatbotType: z.enum(['tour', 'website']).optional(),
  config: chatbotSettingsSchema.optional().default({}),
}).strict();

const updateConfigRequestSchema = z.object({
  configId: z.string().uuid(),
  updates: chatbotSettingsSchema.refine(
    (updates) => Object.keys(updates).length > 0,
    'At least one update is required'
  ),
}).strict();

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
    const chatbotConfigId = searchParams.get('chatbotConfigId');
    const venueId = getScopedVenueId(authResult, requestedVenueId);

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;

    if (chatbotType && chatbotType !== 'tour' && chatbotType !== 'website') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Must be "tour", "website" or omitted' },
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

    if (chatbotConfigId) {
      query = query.eq('id', chatbotConfigId);
    }

    if (tourId) {
      const tourScopeError = await ensureTourScope(venueId, tourId);
      if (tourScopeError) return tourScopeError;
      query = query.eq('tour_id', tourId);
    }

    if (chatbotType) {
      query = query.eq('chatbot_type', chatbotType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (tourId || chatbotConfigId) {
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

    const parsedRequest = updateConfigRequestSchema.safeParse(await request.json());
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: `Invalid input: ${parsedRequest.error.errors.map((entry) => entry.message).join(', ')}` },
        { status: 400 }
      );
    }
    const { configId, updates } = parsedRequest.data;

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

    const parsedRequest = createConfigRequestSchema.safeParse(await request.json());
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: `Invalid input: ${parsedRequest.error.errors.map((entry) => entry.message).join(', ')}` },
        { status: 400 }
      );
    }

    const {
      venueId: requestedVenueId,
      tourId,
      chatbotType,
      config: incomingConfig,
    } = parsedRequest.data;
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId);

    const isWebsiteChatbot = chatbotType === 'website' || (!tourId && chatbotType !== 'tour');

    if (isWebsiteChatbot) {
      return createWebsiteChatbotConfig(authResult, venueId, incomingConfig);
    }

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
    const trustedChatbotType = 'tour' as const;
    
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

    const configData = {
      ...incomingConfig,
      venue_id: venueId,
      tour_id: tourId,
      chatbot_type: trustedChatbotType,
      openai_vector_store_id: vectorStoreId,
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

/**
 * Website chatbots have no Matterport tour (`tour_id` is null) and consume one
 * billing "space" from the shared pool (primary tours + website chatbots), so
 * we must check availability before creating the row.
 */
async function createWebsiteChatbotConfig(
  authResult: Awaited<ReturnType<typeof authenticateChatbotRoute>>,
  venueId: string,
  incomingConfig: Record<string, any>
) {
  if (authResult instanceof NextResponse) return authResult;

  const botCheck = await assertBotAvailable(venueId);
  if (!botCheck.ok) {
    return NextResponse.json(
      { error: botCheck.error, used: botCheck.used, limit: botCheck.limit },
      { status: 403 }
    );
  }

  const { data: venueRow, error: venueFetchError } = await supabase
    .from('venues')
    .select('name')
    .eq('id', venueId)
    .single();

  if (venueFetchError || !venueRow) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const vectorStoreName = `${venueRow.name} - Website Chatbot`;
  let vectorStoreId: string | null = null;
  try {
    const vectorStore = await openAIService.createVectorStore(vectorStoreName);
    vectorStoreId = vectorStore.id;
    console.log(`Created vector store: ${vectorStoreName} (${vectorStoreId})`);
  } catch (openAIError: any) {
    console.error('Failed to create vector store:', openAIError);
  }

  const configData = {
    ...incomingConfig,
    venue_id: venueId,
    tour_id: null,
    chatbot_type: 'website' as const,
    openai_vector_store_id: vectorStoreId,
    chatbot_name: textOrDefault(incomingConfig.chatbot_name, DEFAULT_WEBSITE_CHATBOT_NAME),
    instruction_prompt: textOrDefault(incomingConfig.instruction_prompt, DEFAULT_WEBSITE_INSTRUCTION_PROMPT),
    guardrail_prompt: textOrDefault(incomingConfig.guardrail_prompt, DEFAULT_WEBSITE_GUARDRAIL_PROMPT),
    guardrails_enabled:
      typeof incomingConfig.guardrails_enabled === 'boolean'
        ? incomingConfig.guardrails_enabled
        : true,
    is_active:
      typeof incomingConfig.is_active === 'boolean'
        ? incomingConfig.is_active
        : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chatbot_configs')
    .insert([configData])
    .select()
    .single();

  if (error) {
    if (vectorStoreId) {
      try {
        await openAIService.deleteVectorStore(vectorStoreId);
      } catch (cleanupError) {
        console.error('Failed to cleanup vector store:', cleanupError);
      }
    }
    const status = error.code === 'P0001' && error.message.includes('Bot limit reached') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Seed customisation keyed by chatbot_config_id (website configs have no tour_id).
  try {
    const existingCustomisation = await getChatbotCustomisation(venueId, 'website', null, data.id);
    if (!existingCustomisation) {
      await upsertChatbotCustomisation(
        venueId,
        'website',
        null,
        getAdvancedDefaultCustomisation('website'),
        data.id
      );
    }
  } catch (seedError) {
    console.error('Failed to seed chatbot customisation for new website config:', seedError);
  }

  logChatbotAudit('chatbot_config_created', authResult, { config_id: data.id, chatbot_type: 'website' });
  return NextResponse.json(data);
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