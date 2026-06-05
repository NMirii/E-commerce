import ReliabilityDashboardView from "@/components/reliability/ReliabilityDashboardView";

export const metadata = {
  title: "Reliability Diagnostics Center — GreenShop Admin",
  description: "Enterprise reliability diagnostics and monitoring panel.",
};

export default function ReliabilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Sistem Dayanıqlığı & Monitorinq</h2>
          <p className="text-sm text-slate-500 mt-1">Platformanın xəta idarəetməsi, integrasiya circuit breaker-ləri və logların izlənməsi paneli.</p>
        </div>
      </div>
      
      <div className="bg-[#090b11] rounded-2xl overflow-hidden shadow-2xl">
        <ReliabilityDashboardView />
      </div>
    </div>
  );
}
