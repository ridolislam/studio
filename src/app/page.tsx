import LeadPulseDashboard from "@/components/LeadPulseDashboard";

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">LeadPulse</h1>
          <p className="text-muted-foreground">Smart Data Extraction & Analytics Dashboard</p>
        </div>
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-2" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">System Active</span>
        </div>
      </div>
      
      <LeadPulseDashboard />
    </main>
  );
}