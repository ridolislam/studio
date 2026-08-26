
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { Shield, Zap, Globe, Users, Target } from "lucide-react";

export const metadata = {
  title: 'About Us - The Team Behind numcheckr',
  description: 'Learn about numcheckr, the AI-powered lead verification system designed for modern businesses.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl space-y-16">
        <section className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20">
              <Logo size={80} />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase leading-none">
            Empowering <span className="text-primary">Data</span> Integrity
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            numcheckr was born out of a simple necessity: to provide businesses with 100% accurate, real-time lead verification using cutting-edge AI technology.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-card rounded-3xl border border-white/5 space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black italic uppercase">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Our mission is to eliminate bad data from your sales pipeline. We believe that every business deserves clean, actionable leads to maximize their growth potential without wasting resources on invalid contacts.
            </p>
          </div>
          <div className="p-8 bg-card rounded-3xl border border-white/5 space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black italic uppercase">Our Tech</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Using a distributed network of AI workers, we provide real-time validation across 200+ countries. Our system doesn't just check if a number exists; it identifies carrier info, line type, and geographic details.
            </p>
          </div>
        </section>

        <section className="bg-primary/5 p-12 rounded-[3rem] border border-primary/10 text-center space-y-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Why We Are Different</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-primary">99.9%</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Accuracy Rate</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-primary">200+</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Countries</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-primary">Real-time</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Processing</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-primary">Secure</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Encryption</p>
            </div>
          </div>
        </section>

        <footer className="text-center pt-10">
          <p className="text-muted-foreground text-sm font-medium italic">
            Trusted by lead generation agencies and marketing teams worldwide.
          </p>
        </footer>
      </main>
    </div>
  );
}
