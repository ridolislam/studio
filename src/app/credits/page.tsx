
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const PRICE_PER_CREDIT = 0.05; 
  const totalPrice = (creditAmount * PRICE_PER_CREDIT).toFixed(2);

  useEffect(() => {
    setIsMounted(true);
    console.log("CreditsPage: Component Mounted");

    // Force check after 3 seconds if still loading
    const timer = setTimeout(() => {
      if (!currentUser && !hookUser && !auth.currentUser) {
        console.warn("CreditsPage: Auth Timeout. No user found.");
        setInitError("Auth timeout. Please ensure you are logged in.");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [auth, hookUser, currentUser]);

  useEffect(() => {
    if (hookUser) {
      console.log("CreditsPage: User found from hook", hookUser.uid);
      setCurrentUser(hookUser);
    } else if (auth.currentUser) {
      console.log("CreditsPage: User found from direct auth", auth.currentUser.uid);
      setCurrentUser(auth.currentUser);
    }
  }, [hookUser, auth.currentUser]);

  const handlePurchase = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Auth Error", description: "You must be logged in." });
      return;
    }
    
    setIsPurchasing(true);
    try {
      console.log("CreditsPage: Starting purchase for user", currentUser.uid);
      const userRef = doc(db, "users", currentUser.uid);
      
      // Check if document exists first to avoid confusing errors
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        console.error("CreditsPage: User document does not exist in Firestore.");
        toast({ 
          variant: "destructive", 
          title: "Setup Error", 
          description: "User profile not found in Firestore. Please sign up again." 
        });
        setIsPurchasing(false);
        return;
      }

      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });
      
      toast({ title: "Success!", description: `${creditAmount} credits added.` });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("CreditsPage: Transaction Error", error);
      toast({ 
        variant: "destructive", 
        title: "Transaction Failed", 
        description: error.message || "Failed to update credits." 
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isMounted) return null;

  if (hookLoading && !currentUser && !initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Checking Authentication...</p>
          <p className="text-[10px] text-muted-foreground italic">If this takes too long, check Firebase Console Auth settings.</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-black">Auth Issue Detected</CardTitle>
            <CardDescription>{initError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please ensure:</p>
            <ul className="text-xs space-y-2 mt-2 list-disc pl-4 text-muted-foreground">
              <li>Firebase Auth (Email/Google) is enabled in Console.</li>
              <li>You are actually logged in.</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full">Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
          <p className="text-muted-foreground font-medium">Add credits to your account by typing the amount below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <Card className="lg:col-span-3 border-primary/20 bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-3xl font-black italic flex items-center gap-2">
                Type Amount
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
                  placeholder="500"
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
              <h3 className="text-2xl font-black italic">Helpful Tip</h3>
              <p className="text-sm text-muted-foreground">
                If the payment doesn't update, please ensure **Firestore Database** is enabled in your Firebase Console.
              </p>
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
