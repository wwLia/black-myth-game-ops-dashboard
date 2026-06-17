import { NextResponse } from "next/server";
import { classifyReview } from "@/lib/classifyReview";
import { loadWukongData } from "@/lib/data/loadWukongData";

export async function GET() {
  const { dashboardData } = await loadWukongData();
  const classifications = dashboardData.reviews.map((review) => ({
    reviewId: review.id,
    ...classifyReview(review.content),
  }));

  return NextResponse.json({
    generatedAt: "2026-06-16 20:30:00",
    summary: "正向口碑集中在战斗体验、美术场景和剧情叙事；短期风险主要来自性能优化反馈。",
    classifications,
  });
}
