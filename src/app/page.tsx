import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card p-3 rounded-xl border border-primary/20 shadow-2xl transform transition hover:scale-110 duration-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" className="text-primary"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" className="text-primary/40"/>
              </svg>
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
