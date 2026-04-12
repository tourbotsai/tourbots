import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardData } from '@/lib/admin-dashboard-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { AdminDashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

const METRICS_CACHE_TTL_MS = 30_000;

let cachedDashboardData: AdminDashboardData | null = null;
let cachedDashboardDataAt = 0;
let inFlightDashboardPromise: Promise<AdminDashboardData> | null = null;

async function getDashboardDataCached(forceRefresh: boolean): Promise<AdminDashboardData> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedDashboardData !== null &&
    now - cachedDashboardDataAt < METRICS_CACHE_TTL_MS
  ) {
    return cachedDashboardData;
  }

  if (inFlightDashboardPromise) {
    return inFlightDashboardPromise;
  }

  inFlightDashboardPromise = getAdminDashboardData()
    .then((data) => {
      cachedDashboardData = data;
      cachedDashboardDataAt = Date.now();
      return data;
    })
    .finally(() => {
      inFlightDashboardPromise = null;
    });

  return inFlightDashboardPromise;
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Cache dashboard payload briefly to reduce repeated heavy DB queries.
    const dashboardData = await getDashboardDataCached(forceRefresh);

    // Return specific data type if requested
    if (type) {
      switch (type) {
        case 'metrics':
          return NextResponse.json({ data: dashboardData.metrics });
        case 'health':
          return NextResponse.json({ data: dashboardData.health });
        case 'revenue':
          return NextResponse.json({ data: dashboardData.revenue });
        case 'engagement':
          return NextResponse.json({ data: dashboardData.engagement });
        case 'activity':
          return NextResponse.json({ data: dashboardData.recentActivity });
        default:
          return NextResponse.json(
            { error: 'Invalid type parameter' },
            { status: 400 }
          );
      }
    }

    // Return all data by default
    return NextResponse.json({ data: dashboardData });
  } catch (error: any) {
    console.error('Error fetching platform metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch platform metrics' },
      { status: 500 }
    );
  }
} 