import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import {
  authenticateChatbotRoute,
  ensureTourScope,
  ensureVenueScope,
  getScopedChatbotConfig,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';

const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['pdf', 'txt', 'doc', 'docx']);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

function isAllowedDocumentType(file: File): boolean {
  const extension = getExtension(file.name);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    return false;
  }

  // Some clients may send generic or blank mime types.
  if (!file.type || file.type === 'application/octet-stream') {
    return true;
  }

  return ALLOWED_DOCUMENT_MIME_TYPES.has(file.type);
}

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const chatbotConfigId = searchParams.get('chatbotConfigId');
    const venueId = authResult.venueId;

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;

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
    
    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    if (chatbotConfigId) {
      query = query.eq('chatbot_config_id', chatbotConfigId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data || []);
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
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requestedVenueId = formData.get('venueId') as string;
    const tourId = formData.get('tourId') as string;
    const chatbotConfigId = formData.get('chatbotConfigId') as string;
    const venueId = authResult.venueId;
    const userId = authResult.userId;

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;
    
    if (!file || !tourId || !chatbotConfigId) {
      return NextResponse.json(
        { error: 'File, tour ID, and chatbot configuration ID are required' },
        { status: 400 }
      );
    }

    if (!isAllowedDocumentType(file)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed types: PDF, TXT, DOC, DOCX' },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size must be greater than 0 and up to 20MB' },
        { status: 400 }
      );
    }

    const tourScopeError = await ensureTourScope(venueId, tourId);
    if (tourScopeError) return tourScopeError;
    const scopedConfig = await getScopedChatbotConfig(chatbotConfigId, venueId);
    if (!scopedConfig) {
      return NextResponse.json({ error: 'Chatbot configuration not found for venue' }, { status: 404 });
    }

    // Upload file to Supabase Storage with chatbot type in path
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${sanitiseFilename(file.name)}`;
    const filePath = `chatbot-documents/${venueId}/${tourId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('venue-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-documents')
      .getPublicUrl(filePath);

    // Save document metadata to database with chatbot_type
    const { data: document, error: dbError } = await supabase
      .from('chatbot_documents')
      .insert([{
        chatbot_config_id: chatbotConfigId,
        venue_id: venueId,
        tour_id: tourId,
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: filePath,
        file_url: publicUrl,
        uploaded_by: userId,
        openai_file_id: '', // Will be set when we implement OpenAI upload
        openai_vector_store_id: '', // Will be set when we implement OpenAI upload
      }])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('venue-documents')
        .remove([filePath]);
      
      throw new Error(`Failed to save document: ${dbError.message}`);
    }

    // Upload to OpenAI for vector search
    try {
      // Get the chatbot config to get vector store ID
      const { data: config } = await supabase
        .from('chatbot_configs')
        .select('openai_vector_store_id')
        .eq('id', chatbotConfigId)
        .single();

      if (config?.openai_vector_store_id) {
        // Upload file to OpenAI and add to vector store
        const fileContent = new File([fileBuffer], file.name, { type: file.type });
        const vectorStoreFile = await openAIService.uploadVectorStoreFile(
          config.openai_vector_store_id,
          fileContent
        );
        
        // Update document record with OpenAI file ID
        await supabase
          .from('chatbot_documents')
          .update({
            openai_file_id: vectorStoreFile.id,
            openai_vector_store_id: config.openai_vector_store_id
          })
          .eq('id', document.id);
      } else {
        console.warn(`No vector store found for chatbot config ${chatbotConfigId}`);
      }
    } catch (openAIError: any) {
      console.warn('Failed to upload to OpenAI vector store:', openAIError);
      // Don't fail the whole request for OpenAI upload issues
    }

    logChatbotAudit('chatbot_document_uploaded', authResult, { chatbot_config_id: chatbotConfigId, tour_id: tourId });
    return NextResponse.json(document);
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
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { documentId, venueId: requestedVenueId, chatbotConfigId } = await request.json();
    const venueId = authResult.venueId;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;

    // Get document info first
    let query = supabase
      .from('chatbot_documents')
      .select('*')
      .eq('id', documentId);
    
    if (venueId) {
      query = query.eq('venue_id', venueId); // Ensure user can only delete their venue's documents
    }

    if (chatbotConfigId) {
      query = query.eq('chatbot_config_id', chatbotConfigId);
    }

    const { data: document, error: fetchError } = await query.single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('venue-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError);
    }

    // Delete from OpenAI vector store if file was uploaded to OpenAI
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
    const { error: dbError } = await supabase
      .from('chatbot_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(dbError.message);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
} 