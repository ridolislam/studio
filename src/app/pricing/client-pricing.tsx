"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Zap, Globe } from "lucide-react";

export default function ClientPricing() {
  const [requests, setRequests] = useState(1000);
  const RATE_PER_REQUEST = 0.0008;
  const totalPrice = (requests * RATE_PER_REQUEST).toFixed(4);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setRequests(val);
  };

  return (
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
  );
}
