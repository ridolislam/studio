"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Calculator, Bitcoin, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createPayment } from "@/app/actions/backend";

export default function CreditsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(1000);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const RATE_PER_CREDIT = 0.0008; 
  const totalPrice = (creditAmount * RATE_PER_CREDIT).toFixed(4);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePurchase = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Required", 
        description: "দয়া করে প্রথমে লগইন করুন!" 
      });
      router.push("/login");
      return;
    }
    const user = JSON.parse(userData);

    if (creditAmount < 100) {
      toast({ 
        variant: "destructive", 
        title: "Minimum Requirement", 
        description: "কমপক্ষে ১০০ ক্রেডিট কিনতে হবে!" 
      });
      return;
    }
    
    setIsPurchasing(true);
    try {
      const result = await createPayment({
        email: user.email,
        credits: creditAmount
      });

      if (result.success && result.invoice_url) {
        toast({ title: "Redirecting...", description: "Opening secure crypto payment gateway." });
        window.location.href = result.invoice_url;
      } else {
        throw new Error(result.message || "Failed to generate payment invoice");
      }
      
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Payment Failed", 
        description: error.message || "সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করুন!" 
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-5xl space-y-12">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="rounded-2xl border border-white/5 hover:bg-white/5 group"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Dashboard</span>
          </Button>
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-2xl font-black italic tracking-tighter text-3d">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-green-500">
            <ShieldCheck className="h-3 w-3" /> Anonymous Payments (No KYC)
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase leading-none">
            Add <span className="text-primary">Credits</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
            Secure your lead validation with anonymous crypto payments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-2 border-primary/20 bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                <Calculator className="h-6 w-6 text-primary" />
                Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-10 p-8">
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="w-full md:flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Quantity</label>
                    <div className="relative group">
                      <Input 
                        id="buyAmount"
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-20 text-4xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-2xl px-6"
                      />
                      <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary/10" />
                    </div>
                  </div>
                  <div className="text-left md:text-right space-y-1 bg-primary/5 p-4 rounded-2xl border border-primary/10 min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Price (USD)</p>
                    <div className="flex items-baseline justify-start md:justify-end gap-1">
                      <span className="text-5xl font-black text-foreground italic">${totalPrice}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">USD</span>
                    </div>
                  </div>
                </div>

                <div className="py-6 space-y-4">
                  <Slider 
                    value={[creditAmount]} 
                    onValueChange={(val) => setCreditAmount(val[0])} 
                    max={100000} 
                    min={100}
                    step={100}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Min 100</span>
                    <span className="text-primary/70">Control slider</span>
                    <span>Max 100k</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-20 text-xl md:text-2xl font-black italic bg-gradient-to-r from-white to-primary text-slate-900 rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse-zoom"
              >
                {isPurchasing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <Bitcoin className="h-8 w-8" />
                    PAY WITH CRYPTO
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/5 bg-card/60 shadow-xl backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-black italic">Instant Crypto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  "No ID Verification Required",
                  "Direct Crypto Wallet",
                  "Support 50+ Coins",
                  "Instant Credit Activation",
                  "Private & Secure"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{feat}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">নির্দেশনা</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ১. ক্রেডিট সিলেক্ট করে <strong>PAY WITH CRYPTO</strong> এ ক্লিক করুন।<br/>
                ২. কোনো আইডি কার্ড ছাড়াই পেমেন্ট সম্পন্ন করুন।<br/>
                ৩. পেমেন্ট শেষে অটোমেটিক আপনার ব্যালেন্স আপডেট হবে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
