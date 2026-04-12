import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

// GET - Fetch a single tour point by ID (public, no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: { pointId: string } }
) {
  try {
    const { pointId } = await params;

    const { data: point, error } = await supabase
      .from('tour_points')
      .select('*')
      .eq('id', pointId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Tour point not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(point);

  } catch (error: any) {
    console.error('Error fetching tour point:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

