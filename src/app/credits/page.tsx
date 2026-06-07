
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  }, []);

  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      router.push("/login");
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });

      toast({
        title: "Success!",
        description: `${creditAmount} credits added to your account.`,
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete purchase. Check your internet connection.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold animate-pulse">Initializing Payment Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="group rounded-xl border border-white/5">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xl font-black italic tracking-tighter">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black italic text-3d tracking-tighter uppercase">Refill Wallet</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-tight">Get more credits to continue validating leads with AI precision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="border-primary/20 bg-card shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                Custom Credits
                <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Pay only for what you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 flex-1">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Enter Amount</label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-16 text-3xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-2xl pl-12 focus:ring-primary"
                    placeholder="500"
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/50" />
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Rate: $0.05 / Credit</p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-xs font-bold uppercase text-primary tracking-widest">Calculated Total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black italic text-foreground">${totalPrice}</span>
                  <span className="text-muted-foreground font-medium">USD</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-14 text-xl font-black italic bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all"
              >
                {isPurchasing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-6 w-6" /> 
                    BUY {creditAmount} CREDITS
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/5 bg-card/50 shadow-xl flex flex-col">
            <CardContent className="space-y-8 p-8 flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className="text-xl font-black italic border-b border-white/5 pb-2">Plan Benefits</h3>
                <ul className="space-y-4">
                  {[
                    "No expiration on credits",
                    "Bulk processing enabled",
                    "AI lead extraction tools",
                    "Download validated reports",
                    "24/7 Priority support"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-white/5">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Safe & Secure</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Encrypted Transaction</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
