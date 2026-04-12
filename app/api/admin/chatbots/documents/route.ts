import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const chatbotType = searchParams.get('chatbotType');

    let query = supabase
      .from('chatbot_documents')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (venueId && venueId !== 'all') {
      query = query.eq('venue_id', venueId);
    }

    if (chatbotType) {
      if (chatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'chatbotType filter must be "tour" or omitted' },
          { status: 400 }
        );
      }
      query = query.eq('chatbot_type', 'tour');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const venueId = formData.get('venueId') as string;
    const userId = formData.get('userId') as string;
    const rawChatbotType = formData.get('chatbotType') as string | null;

    if (!file || !venueId) {
      return NextResponse.json(
        { error: 'File and venue ID are required' },
        { status: 400 }
      );
    }

    if (rawChatbotType && rawChatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'chatbotType must be "tour" or omitted' },
        { status: 400 }
      );
    }
    const chatbotType = 'tour' as const;

    // Get or create vector store for this venue and chatbot type
    let vectorStoreId: string;
    
    // Check if venue already has a vector store for this chatbot type
    const { data: config, error: configError } = await supabase
      .from('chatbot_configs')
      .select('openai_vector_store_id')
      .eq('venue_id', venueId)
      .eq('chatbot_type', chatbotType)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw configError;
    }

    if (config?.openai_vector_store_id) {
      vectorStoreId = config.openai_vector_store_id;
    } else {
      // Create new vector store
      const { data: venueRow } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();
      
      const chatbotTypeName = 'Tour';
      const vectorStore = await openAIService.createVectorStore(
        `${venueRow?.name || 'Venue'} ${chatbotTypeName} Knowledge Base`
      );
      vectorStoreId = vectorStore.id;

      // Update chatbot config with vector store ID
      await supabase
        .from('chatbot_configs')
        .update({ openai_vector_store_id: vectorStoreId })
        .eq('venue_id', venueId)
        .eq('chatbot_type', chatbotType);
    }

    // Upload file to OpenAI
    const uploadedFile = await openAIService.uploadVectorStoreFile(vectorStoreId, file);

    // Prepare document data - only include uploaded_by if userId is a valid UUID
    const documentData: any = {
      venue_id: venueId,
      original_filename: file.name,
      file_size: file.size,
      file_type: file.type,
      openai_file_id: uploadedFile.id,
      openai_vector_store_id: vectorStoreId,
      chatbot_type: chatbotType,
    };

    // Only add uploaded_by if userId looks like a valid UUID (36 characters with dashes)
    if (userId && userId.length === 36 && userId.includes('-')) {
      documentData.uploaded_by = userId;
    }

    // Save document record to database
    const { data: document, error: docError } = await supabase
      .from('chatbot_documents')
      .insert([documentData])
      .select()
      .single();

    if (docError) {
      // Clean up OpenAI file if database insert fails
      try {
        await openAIService.deleteFile(uploadedFile.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup OpenAI file:', cleanupError);
      }
      throw docError;
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { documentId, venueId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('chatbot_documents')
      .select('openai_file_id, openai_vector_store_id')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from OpenAI vector store
    if (document.openai_file_id && document.openai_vector_store_id) {
      try {
        // Use complete file deletion to work around OpenAI's vector store deletion bugs
        // This will remove from vector store AND delete the file entirely from OpenAI
        await openAIService.deleteVectorStoreFile(
          document.openai_vector_store_id, 
          document.openai_file_id,
          true // Delete file completely to ensure it's removed from vector store
        );
      } catch (openaiError) {
        console.error('Failed to delete from OpenAI:', openaiError);
        // Continue with database deletion even if OpenAI deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('chatbot_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
} 