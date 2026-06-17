import { NextResponse } from "next/server";
import { reviewCategories, topicNetwork } from "@/data/mock/mockReviews";
import { loadWukongData } from "@/lib/data/loadWukongData";

export async function GET() {
  const { dashboardData } = await loadWukongData();

  return NextResponse.json({
    reviews: dashboardData.reviews,
    categories: reviewCategories,
    topicNetwork,
  });
}
