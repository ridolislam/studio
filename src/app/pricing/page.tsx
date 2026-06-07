
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Check, Phone, Globe, Shield } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [requests, setRequests] = useState(1000);
  const RATE_PER_REQUEST = 0.0008;
  const totalPrice = (requests * RATE_PER_REQUEST).toFixed(4);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setRequests(val);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-black italic text-3d">Flexible Pricing</h1>
          <p className="text-xl text-muted-foreground">Pay only for what you use. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Calculator Card */}
          <Card className="lg:col-span-2 border-primary/20 bg-card shadow-2xl hover:-translate-y-1 transition-all">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-bold">Request Estimator</CardTitle>
              <CardDescription>Drag the slider to estimate your monthly cost.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-widest opacity-70">Total Requests</label>
                    <Input 
                      type="number" 
                      value={requests} 
                      onChange={handleInputChange}
                      className="text-2xl font-code font-bold w-40 border-primary/30"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-70">Estimated Cost</p>
                    <p className="text-4xl font-black text-primary italic">${totalPrice}</p>
                  </div>
                </div>
                
                <Slider 
                  value={[requests]} 
                  onValueChange={(val) => setRequests(val[0])} 
                  max={100000} 
                  step={100}
                  className="py-4"
                />
                
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>100 Req</span>
                  <span>100,000 Req</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-white/5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Instant Processing</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-white/5">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">200+ Countries</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Button className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none rounded-xl">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
