import { NextRequest, NextResponse } from "next/server";
import { getPublicGuides } from "@/lib/services/public-guide-service";

function parseFilters(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : undefined;
  const difficulty = searchParams.get("difficulty") || undefined;
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));

  return {
    search,
    tags,
    difficulty: difficulty as "beginner" | "intermediate" | "advanced" | undefined,
    limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    offset: Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseFilters(request);
    const guides = await getPublicGuides(filters);
    return NextResponse.json({ success: true, guides });
  } catch (error: any) {
    console.error("Error loading public guides:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load guides" },
      { status: 500 }
    );
  }
}
