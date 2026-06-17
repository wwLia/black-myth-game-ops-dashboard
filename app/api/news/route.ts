import { NextResponse } from "next/server";
import { getMockNewsOverview } from "@/lib/newsApi";

export async function GET() {
  return NextResponse.json(await getMockNewsOverview());
}
