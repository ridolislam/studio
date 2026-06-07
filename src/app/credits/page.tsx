
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CreditsPage() {
  const { user: hookUser, loading: hookLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const PRICE_PER_CREDIT = 0.05; 
  const totalPrice = (creditAmount * PRICE_PER_CREDIT).toFixed(2);

  // Initial Mounting and Auth Fallback
  useEffect(() => {
    setIsMounted(true);
    
    // Fallback: If hook is stuck in loading, check auth.currentUser directly
    const timer = setTimeout(() => {
      if (!authResolved) {
        console.log("CreditsPage: Auth timeout fallback triggered");
        if (auth.currentUser) {
          setCurrentUser(auth.currentUser);
          setAuthResolved(true);
        } else {
          // If still no user, redirect to login
          router.replace("/login");
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [auth, authResolved, router]);

  // Sync state with hook
  useEffect(() => {
    if (!hookLoading) {
      setCurrentUser(hookUser);
      setAuthResolved(true);
    }
  }, [hookUser, hookLoading]);

  const handlePurchase = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Auth Error", description: "Login required." });
      return;
    }
    
    setIsPurchasing(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });
      toast({ title: "Success!", description: "Credits added." });
      router.push("/dashboard");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Transaction failed." });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted || (!authResolved && hookLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Initializing Wallet...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="container mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="rounded-2xl border border-white/5"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="font-bold">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-2xl font-black italic tracking-tighter">numcheckr</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase">Refill Wallet</h1>
          <p className="text-muted-foreground font-medium">Add credits to your account instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <Card className="lg:col-span-3 border-primary/20 bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-3xl font-black italic flex items-center gap-2">
                Amount
                <Sparkles className="h-6 w-6 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-10 p-8">
              <div className="space-y-4">
                <Input 
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-20 text-4xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-3xl pl-16"
                />
              </div>

              <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black italic">${totalPrice}</span>
                  <span className="text-muted-foreground font-black text-xl uppercase italic">USD</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handlePurchase}
                disabled={isPurchasing || creditAmount < 100}
                className="w-full h-16 text-2xl font-black italic bg-primary rounded-3xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all"
              >
                {isPurchasing ? <Loader2 className="h-8 w-8 animate-spin" /> : "BUY NOW"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2 border-white/5 bg-card/40 flex flex-col justify-center">
            <CardContent className="p-10 space-y-6">
              <h3 className="text-2xl font-black italic">Benefits</h3>
              <ul className="space-y-4">
                {["No Expiration", "Bulk Processing", "AI Validation", "Premium Support"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-bold uppercase">{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
