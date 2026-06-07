
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard, DollarSign, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreditsPage() {
  const { user: hookUser, loading: hookLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(1000);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const RATE_PER_CREDIT = 0.0008; 
  const totalPrice = (creditAmount * RATE_PER_CREDIT).toFixed(4);

  useEffect(() => {
    setIsMounted(true);
    console.log("CreditsPage Mounted");
  }, []);

  const handlePurchase = async () => {
    const currentUser = hookUser || auth.currentUser;
    
    if (!currentUser) {
      toast({ variant: "destructive", title: "Auth Error", description: "Please login to purchase credits." });
      return;
    }

    if (creditAmount < 1) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid credit amount." });
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
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          credits: increment(creditAmount)
        });
      }
      
      toast({ title: "Success!", description: `${creditAmount} credits added successfully.` });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Purchase Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Purchase Failed", 
        description: "Firestore security rules or connection error. Please verify rules in Firebase Console." 
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="rounded-2xl border border-white/5 hover:bg-white/5 group"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back to Dashboard</span>
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-2xl font-black italic tracking-tighter">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase">Add Credits</h1>
          <p className="text-muted-foreground font-medium text-lg">Scale your lead validation with AI precision.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Calculator Section */}
          <Card className="lg:col-span-2 border-primary/20 bg-card shadow-2xl relative overflow-hidden transition-all hover:shadow-primary/5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                <Calculator className="h-6 w-6 text-primary" />
                Credit Estimator
              </CardTitle>
              <CardDescription>Adjust the amount to see your custom pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Quantity</label>
                    <Input 
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-16 text-3xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-2xl px-6"
                    />
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Cost</p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-4xl font-black text-foreground italic">${totalPrice}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">USD</span>
                    </div>
                  </div>
                </div>

                <div className="py-4">
                  <Slider 
                    value={[creditAmount]} 
                    onValueChange={(val) => setCreditAmount(val[0])} 
                    max={100000} 
                    step={100}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground uppercase">
                    <span>100 Req</span>
                    <span>100,000 Req</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter">Rate</p>
                    <p className="text-sm font-black italic">$0.0008 / Credit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter">Validity</p>
                    <p className="text-sm font-black italic">Lifetime Access</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 1 || (!hookUser && !auth.currentUser)}
                className="w-full h-16 text-2xl font-black italic bg-primary hover:bg-primary/90 rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none transition-all"
              >
                {isPurchasing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    PURCHASE {creditAmount.toLocaleString()} CREDITS
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Info Section */}
          <div className="space-y-6">
            <Card className="border-white/5 bg-card/40 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-black italic">Why Credits?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  "No monthly subscriptions",
                  "Credits never expire",
                  "Instant processing speed",
                  "Global validation coverage",
                  "AI data extraction ready"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight text-muted-foreground">{feat}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">Need Help?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you encounter any issues during purchase, ensure your <strong>Firestore Rules</strong> allow writes to the <code>/users</code> collection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
