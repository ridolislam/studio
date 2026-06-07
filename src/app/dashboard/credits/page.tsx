
"use client";

import { useState } from "react";
import { Zap, Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const PACKAGES = [
  { id: "starter", name: "Starter", credits: 100, price: 5, popular: false },
  { id: "pro", name: "Pro Pack", credits: 1000, price: 40, popular: true },
  { id: "enterprise", name: "Enterprise", credits: 5000, price: 150, popular: false },
];

export default function CreditsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    if (!user) return;
    
    setIsPurchasing(pkg.id);
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(pkg.credits)
      });

      toast({
        title: "Purchase Successful!",
        description: `${pkg.credits} credits have been added to your wallet.`,
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process purchase. Please try again.",
      });
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-5xl space-y-8">
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
          <p className="text-muted-foreground text-lg">Choose a credit pack to continue validating leads with AI precision.</p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative border-primary/20 bg-card shadow-2xl transition-all hover:-translate-y-2 overflow-hidden ${pkg.popular ? 'border-primary border-2 scale-105' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-3 py-1 rotate-45 translate-x-4 translate-y-2 shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                  {pkg.name}
                  {pkg.popular && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
                </CardTitle>
                <CardDescription>Instant credit delivery</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black italic text-primary">${pkg.price}</span>
                  <span className="text-muted-foreground font-bold">One-time</span>
                </div>
                
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">You Get</p>
                  <p className="text-3xl font-code font-black italic">{pkg.credits} CREDITS</p>
                </div>

                <ul className="space-y-3">
                  {["Instant delivery", "No expiry date", "Full API access", "Bulk support"].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium">
                      <Check className="h-4 w-4 text-green-500" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  disabled={isPurchasing !== null}
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full h-12 font-bold text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all ${pkg.popular ? 'bg-primary' : 'variant-outline'}`}
                >
                  {isPurchasing === pkg.id ? <Loader2 className="animate-spin" /> : "Purchase Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center pt-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
          <p>Secure payment processing. Credits are added instantly to your account.</p>
          <div className="flex gap-4 opacity-50 font-bold uppercase tracking-tighter text-[10px]">
            <span>Verified SSL</span>
            <span>PCI Compliant</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
