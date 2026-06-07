
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CreditsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const PRICE_PER_CREDIT = 0.05; 
  const totalPrice = (creditAmount * PRICE_PER_CREDIT).toFixed(2);

  useEffect(() => {
    setIsMounted(true);
    console.log("CreditsPage: Component Mounted");
  }, []);

  useEffect(() => {
    if (isMounted) {
      console.log("CreditsPage: Auth State ->", { authLoading, hasUser: !!user });
      if (!authLoading && !user) {
        console.log("CreditsPage: No user session, redirecting to /login");
        router.replace("/login");
      }
    }
  }, [user, authLoading, isMounted, router]);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please login to buy credits.",
      });
      return;
    }
    
    if (creditAmount < 100) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum 100 credits required.",
      });
      return;
    }
    
    setIsPurchasing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });

      toast({
        title: "Transaction Complete!",
        description: `${creditAmount} credits have been added successfully.`,
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("CreditsPage: Purchase Error", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not process request.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGoBack = () => {
    console.log("CreditsPage: Returning to dashboard");
    router.push("/dashboard");
  };

  if (!isMounted) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold animate-pulse">Checking Wallet Status...</p>
        </div>
      </div>
    );
  }

  // If loading is done and there's still no user, the useEffect will handle the redirect.
  // We return a simple loader instead of null to prevent an empty screen while redirecting.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="container mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="group rounded-2xl border border-white/5 hover:bg-white/5"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back to Dashboard</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase leading-none">Refill Wallet</h1>
          <p className="text-muted-foreground text-lg leading-tight font-medium">Add credits to process more leads with AI-powered accuracy.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          <Card className="lg:col-span-3 border-primary/20 bg-card shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-3xl font-black italic flex items-center gap-2">
                Custom Amount
                <Sparkles className="h-6 w-6 text-primary" />
              </CardTitle>
              <CardDescription className="text-sm font-medium mt-1">Select the exact number of credits you want</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 p-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Credit Units</label>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">Unit Price: $0.05</span>
                </div>
                <div className="relative group">
                  <Input 
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-20 text-4xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-3xl pl-16 focus:ring-primary transition-all"
                    placeholder="500"
                  />
                  <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary opacity-50" />
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 space-y-3 shadow-inner">
                <p className="text-xs font-black uppercase text-primary tracking-widest opacity-70">Estimated Total</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black italic text-foreground tracking-tighter">${totalPrice}</span>
                  <span className="text-muted-foreground font-black text-xl italic uppercase tracking-tighter">USD</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-16 text-2xl font-black italic bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:translate-y-1.5 transition-all flex items-center justify-center gap-3"
              >
                {isPurchasing ? <Loader2 className="h-8 w-8 animate-spin" /> : <><CreditCard className="h-7 w-7" /> BUY {creditAmount} CREDITS</>}
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2 border-white/5 bg-card/40 shadow-xl flex flex-col h-full">
            <CardContent className="space-y-10 p-10 flex-1">
              <div className="space-y-6">
                <h3 className="text-2xl font-black italic border-b border-white/5 pb-3">Wallet Benefits</h3>
                <ul className="space-y-5">
                  {[
                    { text: "No Expiration", desc: "Credits never expire, use them anytime." },
                    { text: "Bulk Processing", desc: "Unlock massive data extraction tools." },
                    { text: "AI Validation", desc: "Use advanced GenAI lead scoring." },
                    { text: "Premium Support", desc: "Get help from our expert team 24/7." },
                    { text: "Data Priority", desc: "Your requests go to the front of the line." }
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="mt-1 h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black italic uppercase tracking-tight">{feat.text}</p>
                        <p className="text-xs text-muted-foreground font-medium leading-none">{feat.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
