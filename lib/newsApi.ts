import { loadWukongData } from "@/lib/data/loadWukongData";

export async function getMockNewsOverview() {
  const { dashboardData } = await loadWukongData();

  return {
    radarMetrics: dashboardData.newsRadarMetrics,
    news: dashboardData.newsItems,
  };
}
