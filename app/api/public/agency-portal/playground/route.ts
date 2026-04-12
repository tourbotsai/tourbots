import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Agency portal playground has been removed. Use the Tour tab for testing.' },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Agency portal playground has been removed. Use the Tour tab for testing.' },
    { status: 410 }
  );
}

