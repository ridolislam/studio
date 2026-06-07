
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CreditsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const PRICE_PER_CREDIT = 0.05; // $0.05 per credit

  const totalPrice = (creditAmount * PRICE_PER_CREDIT).toFixed(2);

  const handlePurchase = async () => {
    if (!user) return;
    if (creditAmount < 100) {
      toast({
        variant: "destructive",
        title: "Minimum Purchase",
        description: "Minimum 100 credits required to purchase.",
      });
      return;
    }
    
    setIsPurchasing(true);
    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });

      toast({
        title: "Purchase Successful!",
        description: `${creditAmount} credits have been added to your wallet.`,
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process purchase. Please try again.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xl font-black italic">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black italic text-3d tracking-tighter">Refuel Your Wallet</h1>
          <p className="text-muted-foreground text-lg">Enter the amount of credits you need for your next validation session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Custom Input Card */}
          <Card className="border-primary/20 bg-card shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                Custom Credits
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription>Type the amount you want to buy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Number of Credits</label>
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
                <p className="text-[10px] text-muted-foreground font-bold">MINIMUM PURCHASE: 100 CREDITS</p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-xs font-bold uppercase text-primary tracking-widest">Total Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black italic text-foreground">${totalPrice}</span>
                  <span className="text-muted-foreground font-medium">USD</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-14 text-xl font-black italic bg-primary hover:bg-primary/90 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all group"
              >
                {isPurchasing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" /> 
                    BUY {creditAmount} CREDITS NOW
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Info Card */}
          <Card className="border-white/5 bg-card/50 shadow-xl flex flex-col justify-center">
            <CardContent className="space-y-8 p-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black italic">Why Credits?</h3>
                <ul className="space-y-4">
                  {[
                    "Pay as you go, no monthly subscription",
                    "Credits never expire",
                    "Global validation coverage included",
                    "Unlimited data exports (XLSX/CSV)",
                    "Real-time API access for large batches"
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

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Standard Rate</p>
                    <p className="text-xs text-muted-foreground">$0.05 per verification credit</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Info */}
        <div className="text-center pt-8 opacity-50 space-y-4">
          <div className="flex flex-wrap justify-center gap-6 grayscale">
             <div className="flex items-center gap-1 font-black italic text-xl">VISA</div>
             <div className="flex items-center gap-1 font-black italic text-xl">STRIPE</div>
             <div className="flex items-center gap-1 font-black italic text-xl">PAYPAL</div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest">Secure 256-bit encrypted transactions</p>
        </div>
      </div>
    </div>
  );
}
