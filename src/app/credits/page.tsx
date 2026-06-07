
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard, Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CreditsPage() {
  const { user: hookUser, loading: hookLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(1000);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // New Rate: $0.0008 per credit
  const RATE_PER_CREDIT = 0.0008; 
  const totalPrice = (creditAmount * RATE_PER_CREDIT).toFixed(4);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePurchase = async () => {
    const currentUser = hookUser || auth.currentUser;
    
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login to purchase credits." });
      return;
    }

    if (creditAmount < 100) {
      toast({ variant: "destructive", title: "Minimum Requirement", description: "Minimum purchase is 100 credits." });
      return;
    }
    
    setIsPurchasing(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          credits: creditAmount,
          totalRequests: 0,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          credits: increment(creditAmount)
        });
      }
      
      toast({ title: "Purchase Successful!", description: `${creditAmount.toLocaleString()} credits have been added to your account.` });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Purchase Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Transaction Failed", 
        description: "Firestore permission error. Ensure you have published the Security Rules in Firebase Console." 
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-5xl space-y-12">
        {/* Navigation Header */}
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
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-2xl font-black italic tracking-tighter">numcheckr</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Best Value Guaranteed
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase leading-none">
            Scale Your <span className="text-primary">Growth</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
            Get premium validation credits at our lowest price ever of $0.0008 per request.
          </p>
        </div>

        {/* Calculator & Pricing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Calculator Card */}
          <Card className="lg:col-span-2 border-primary/20 bg-card shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all hover:shadow-primary/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                <Calculator className="h-6 w-6 text-primary" />
                Credit Calculator
              </CardTitle>
              <CardDescription>Enter amount or use the slider to adjust</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 p-8">
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="w-full md:flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Quantity (Credits)</label>
                    <div className="relative group">
                      <Input 
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-20 text-4xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-2xl px-6 focus:border-primary/50 transition-all"
                      />
                      <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary/10 group-focus-within:text-primary/30 transition-colors" />
                    </div>
                  </div>
                  <div className="text-left md:text-right space-y-1 bg-primary/5 p-4 rounded-2xl border border-primary/10 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Estimated Cost</p>
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
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Min 100</span>
                    <span className="text-primary/70">Flexible Control</span>
                    <span>Max 100,000</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-2xl border border-white/5">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Unit Rate</p>
                    <p className="text-lg font-black italic">$0.0008 <span className="text-[10px] not-italic text-muted-foreground">/ Credit</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-2xl border border-white/5">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Access</p>
                    <p className="text-lg font-black italic">Lifetime <span className="text-[10px] not-italic text-muted-foreground">Validity</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-20 text-3xl font-black italic bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 group"
              >
                {isPurchasing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-8 w-8 group-hover:scale-110 transition-transform" />
                    ACTIVATE {creditAmount.toLocaleString()} CREDITS
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Features Side Card */}
          <div className="space-y-6">
            <Card className="border-white/5 bg-card/60 shadow-xl backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-black italic flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Why numcheckr?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  "No Monthly Commitments",
                  "Credits Never Expire",
                  "AI Data Extraction Ready",
                  "Instant Activation",
                  "Bulk Export Supported",
                  "24/7 Processing Power"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{feat}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Need Assistance?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If the purchase doesn't reflect, verify your <strong>Firestore Rules</strong> in the Firebase Console. The rate is fixed at <strong>$0.0008</strong> per validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
