
import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { Zap } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card p-3 rounded-xl border border-primary/20 shadow-2xl transform transition hover:scale-110 duration-500">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter font-headline text-primary italic">numcheckr</h1>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-semibold">Validator Pro</p>
          </div>
        </div>
        <div className="flex gap-2 items-center bg-card border border-primary/10 px-4 py-2 rounded-full shadow-inner">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Core Active</span>
        </div>
      </div>
      
      <LeadPulseDashboard />
    </main>
  );
}
