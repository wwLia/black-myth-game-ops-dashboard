import { NextResponse } from "next/server";
import { mockOpsEvents } from "@/data/mock/mockOpsEvents";
import { getMockPlayerOverview } from "@/lib/steamApi";

export async function GET() {
  const players = await getMockPlayerOverview();

  return NextResponse.json({
    ...players,
    events: mockOpsEvents,
  });
}
