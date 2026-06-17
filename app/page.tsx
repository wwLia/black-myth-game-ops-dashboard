import { DashboardClient } from "@/components/DashboardClient";
import { loadWukongData } from "@/lib/data/loadWukongData";

export default async function Home() {
  const { dashboardData } = await loadWukongData();

  return (
    <main className="min-h-screen px-5 py-5 text-slate-100 lg:px-6">
      <DashboardClient dashboardData={dashboardData} />
    </main>
  );
}
