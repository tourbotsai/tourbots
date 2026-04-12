import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import { authenticateChatbotRoute } from '@/lib/chatbot-route-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden: platform admin access required' }, { status: 403 });
    }

    const results = [];
    
    // Get all chatbot configs that don't have vector stores
    const { data: configs, error: configsError } = await supabase
      .from('chatbot_configs')
      .select(`
        *,
        venues (
          id,
          name
        )
      `)
      .is('openai_vector_store_id', null);

    if (configsError) {
      return NextResponse.json({ error: configsError.message }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        message: 'All chatbot configs already have vector stores!',
        results: []
      });
    }

    // Create vector stores for each config
    for (const config of configs) {
      try {
        const vectorStoreName = `${config.venues.name} - Virtual Tour Chatbot`;
        
        // Create vector store in OpenAI
        const vectorStore = await openAIService.createVectorStore(vectorStoreName);
        
        // Update config with vector store ID
        const { error: updateError } = await supabase
          .from('chatbot_configs')
          .update({
            openai_vector_store_id: vectorStore.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id);

        if (updateError) {
          // Clean up vector store if database update fails
          await openAIService.deleteVectorStore(vectorStore.id);
          results.push({
            configId: config.id,
            chatbotType: config.chatbot_type,
            venueName: config.venues.name,
            success: false,
            error: updateError.message
          });
        } else {
          results.push({
            configId: config.id,
            chatbotType: config.chatbot_type,
            venueName: config.venues.name,
            vectorStoreName,
            vectorStoreId: vectorStore.id,
            success: true
          });
          console.log(`✅ Created vector store: ${vectorStoreName} (${vectorStore.id})`);
        }
      } catch (error: any) {
        results.push({
          configId: config.id,
          chatbotType: config.chatbot_type,
          venueName: config.venues.name,
          success: false,
          error: error.message
        });
        console.error(`❌ Failed to create vector store for ${config.venues.name} ${config.chatbot_type}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processed ${configs.length} chatbot configs`,
      results
    });
  } catch (error: any) {
    console.error('Error setting up vector stores:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to setup vector stores' },
      { status: 500 }
    );
  }
} 