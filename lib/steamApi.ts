import { loadWukongData } from "@/lib/data/loadWukongData";

export async function getMockPlayerOverview() {
  const { dashboardData } = await loadWukongData();

  return {
    kpis: dashboardData.kpiMetrics,
    onlineTrend: dashboardData.onlineTrend,
    playtimeDistribution: dashboardData.playtimeDistribution,
    playtimeSentiment: dashboardData.playtimeSentiment,
  };
}
