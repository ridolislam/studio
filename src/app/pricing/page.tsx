import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Check, Phone, Globe, Shield } from "lucide-react";
import Link from "next/link";
import ClientPricing from "./client-pricing";

export const metadata = {
  title: 'Pricing - Affordable Lead Verification Plans',
  description: 'Flexible pay-as-you-go pricing for phone number validation. Only $0.0008 per request with bulk discounts.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-5xl">
        <header className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-black italic text-3d">Flexible Pricing</h1>
          <p className="text-xl text-muted-foreground">Pay only for what you use. No hidden fees.</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <ClientPricing />

          {/* Plan Info Card */}
          <Card className="border-accent/20 bg-card shadow-2xl overflow-hidden transform transition-all hover:scale-105">
            <div className="bg-accent h-2 w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-black italic">Pro Plan</CardTitle>
              <CardDescription>Scale as you grow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black italic text-primary">$0.0008</span>
                <span className="text-muted-foreground text-sm">/request</span>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Bulk CSV Processing",
                  "AI Lead Extraction",
                  "Mobile vs Landline Check",
                  "API Access",
                  "Priority Support",
                  "Data Export (XLSX/CSV)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/signup" className="block pt-4">
                <Button aria-label="Start using pro plan" className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none rounded-xl">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
