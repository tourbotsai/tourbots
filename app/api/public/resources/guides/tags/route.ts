import { NextResponse } from "next/server";
import { getPublicGuideTags } from "@/lib/services/public-guide-service";

export async function GET() {
  try {
    const tags = await getPublicGuideTags();
    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    console.error("Error loading guide tags:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load guide tags" },
      { status: 500 }
    );
  }
}
