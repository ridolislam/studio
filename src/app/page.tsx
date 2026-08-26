
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleCheck, Shield, Globe, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse"></div>
          
          <div className="relative z-10 space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4 animate-bounce">
              <Logo size={24} />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Next Gen Validation</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
               <Logo size={120} className="mb-4 drop-shadow-[0_10px_30px_rgba(113,85,255,0.4)]" />
               <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-3d italic">
                num<span className="text-primary">checkr</span>
               </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Verify, validate, and clean your business leads with AI-powered precision. The ultimate tool for modern lead generation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" aria-label="Start your free trial" className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all rounded-2xl group">
                  Get Started Free <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" aria-label="View pricing plans" className="h-14 px-10 text-lg font-bold border-2 hover:bg-accent/10 rounded-2xl">
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-white/5">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                  <CircleCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-sm font-semibold">99.9% Accuracy</h2>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                  <Logo size={24} />
                </div>
                <h2 className="text-sm font-semibold">Real-time API</h2>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-sm font-semibold">Secure Data</h2>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-card rounded-xl border border-primary/10 mb-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-sm font-semibold">Global Coverage</h2>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/5">
          <div className="container mx-auto px-4 text-center space-y-10">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Why Choose numcheckr?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-card rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-xl font-bold text-primary">Bulk Processing</h3>
                <p className="text-muted-foreground">Process thousands of phone numbers in seconds with our distributed worker system.</p>
              </div>
              <div className="p-8 bg-card rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-xl font-bold text-primary">Carrier Detection</h3>
                <p className="text-muted-foreground">Identify mobile, landline, and VoIP numbers accurately across 200+ countries.</p>
              </div>
              <div className="p-8 bg-card rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-xl font-bold text-primary">AI Insights</h3>
                <p className="text-muted-foreground">Clean your lead lists by removing duplicates and invalid entries automatically.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black/20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Logo size={32} />
              <span className="text-xl font-black italic tracking-tighter">numcheckr</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
              The ultimate AI-powered tool for business lead verification and phone number validation.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Resources</h4>
            <div className="flex flex-col gap-2 text-center md:text-left">
              <Link href="/about" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors">About Us</Link>
              <Link href="/pricing" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Contact</h4>
            <div className="flex flex-col gap-2 text-center md:text-left">
              <a href="https://wa.me/qr/X3XUFT7RDTI2I1" target="_blank" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors">WhatsApp Support</a>
              <p className="text-sm font-bold text-muted-foreground">support@numcheckr.app</p>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">© {new Date().getFullYear()} numcheckr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
