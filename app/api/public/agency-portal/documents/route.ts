import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

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

  if (!file.type || file.type === 'application/octet-stream') {
    return true;
  }

  return ALLOWED_DOCUMENT_MIME_TYPES.has(file.type);
}

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function getScopedChatbotConfig(chatbotConfigId: string, venueId: string, tourId: string) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select('id, venue_id, tour_id, openai_vector_store_id')
    .eq('id', chatbotConfigId)
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;
    const chatbotConfigId = searchParams.get('chatbotConfigId');

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
    });
    if (session instanceof NextResponse) return session;

    let query = supabase
      .from('chatbot_documents')
      .select('*')
      .eq('venue_id', session.venueId)
      .eq('tour_id', session.tourId)
      .order('created_at', { ascending: false });

    if (chatbotConfigId) {
      const scopedConfig = await getScopedChatbotConfig(chatbotConfigId, session.venueId, session.tourId);
      if (!scopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found for share scope.' }, { status: 404 });
      }
      query = query.eq('chatbot_config_id', chatbotConfigId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Agency portal documents GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch documents.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const shareSlugValue = formData.get('shareSlug');
    const shareSlug = typeof shareSlugValue === 'string' ? shareSlugValue : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const file = formData.get('file') as File | null;
    const chatbotConfigId = formData.get('chatbotConfigId') as string | null;

    if (!file || !chatbotConfigId) {
      return NextResponse.json(
        { error: 'File and chatbotConfigId are required.' },
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

    const scopedConfig = await getScopedChatbotConfig(chatbotConfigId, session.venueId, session.tourId);
    if (!scopedConfig) {
      return NextResponse.json({ error: 'Chatbot configuration not found for share scope.' }, { status: 404 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${sanitiseFilename(file.name)}`;
    const filePath = `chatbot-documents/${session.venueId}/${session.tourId}/${fileName}`;

    const { error: uploadError } = await supabaseServiceRole.storage
      .from('venue-documents')
      .upload(filePath, fileBuffer, { contentType: file.type });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('venue-documents').getPublicUrl(filePath);

    const { data: document, error: insertError } = await supabase
      .from('chatbot_documents')
      .insert([
        {
          chatbot_config_id: chatbotConfigId,
          venue_id: session.venueId,
          tour_id: session.tourId,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
          uploaded_by: null,
          openai_file_id: '',
          openai_vector_store_id: '',
        },
      ])
      .select()
      .single();

    if (insertError || !document) {
      await supabaseServiceRole.storage.from('venue-documents').remove([filePath]);
      throw new Error(insertError?.message || 'Failed to save document.');
    }

    if (scopedConfig.openai_vector_store_id) {
      try {
        const fileContent = new File([fileBuffer], file.name, { type: file.type });
        const vectorStoreFile = await openAIService.uploadVectorStoreFile(
          scopedConfig.openai_vector_store_id,
          fileContent
        );

        await supabase
          .from('chatbot_documents')
          .update({
            openai_file_id: vectorStoreFile.id,
            openai_vector_store_id: scopedConfig.openai_vector_store_id,
          })
          .eq('id', document.id);
      } catch (openAIError) {
        console.warn('Agency portal document uploaded without OpenAI indexing:', openAIError);
      }
    }

    return NextResponse.json(document);
  } catch (error: any) {
    console.error('Agency portal documents POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload document.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const documentId = payload?.documentId as string | undefined;
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }

    const { data: document, error: fetchError } = await supabase
      .from('chatbot_documents')
      .select('*')
      .eq('id', documentId)
      .eq('venue_id', session.venueId)
      .eq('tour_id', session.tourId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    await supabaseServiceRole.storage.from('venue-documents').remove([document.file_path]);

    if (document.openai_file_id && document.openai_vector_store_id) {
      try {
        await openAIService.deleteVectorStoreFile(
          document.openai_vector_store_id,
          document.openai_file_id,
          true
        );
      } catch (openAIError) {
        console.error('Failed to delete OpenAI vector file:', openAIError);
      }
    }

    const { error: deleteError } = await supabase
      .from('chatbot_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Agency portal documents DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete document.' },
      { status: 500 }
    );
  }
}
