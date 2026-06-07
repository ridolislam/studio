
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Shield, Globe, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse"></div>
        
        <div className="relative z-10 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4 animate-bounce">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Next Gen Validation</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-3d italic">
            num<span className="text-primary">checkr</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Verify, validate, and clean your business leads with AI-powered precision. The ultimate tool for modern lead generation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all rounded-2xl group">
                Get Started Free <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-2 hover:bg-accent/10 rounded-2xl">
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">99.9% Accuracy</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Real-time API</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Secure Data</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Global Coverage</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} numcheckr. All rights reserved.</p>
      </footer>
    </div>
  );
}
