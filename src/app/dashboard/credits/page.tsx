
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
  
  const PRICE_PER_CREDIT = 0.05; // $0.05 per credit
  const totalPrice = (creditAmount * PRICE_PER_CREDIT).toFixed(2);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect only if we are sure the user is not logged in after mount
  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, isMounted, router]);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "অথেন্টিকেশন এরর",
        description: "ক্রেডিট কিনতে দয়া করে লগইন করুন।",
      });
      return;
    }
    
    if (creditAmount < 100) {
      toast({
        variant: "destructive",
        title: "কম ক্রেডিট",
        description: "নুন্যতম ১০০ ক্রেডিট কেনা আবশ্যক।",
      });
      return;
    }
    
    setIsPurchasing(true);
    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(creditAmount)
      });

      toast({
        title: "সফল হয়েছে!",
        description: `${creditAmount} ক্রেডিট আপনার ওয়ালেটে যোগ করা হয়েছে।`,
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "সমস্যা হয়েছে",
        description: "পেমেন্ট সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Improved loading state: Don't block the whole page if already mounted and not loading auth
  if (!isMounted || (authLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold italic animate-pulse">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              ড্যাশবোর্ড
            </Button>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xl font-black italic">numcheckr</span>
          </Link>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black italic text-3d tracking-tighter">ক্রেডিট রিফিল</h1>
          <p className="text-muted-foreground text-lg">আপনার ওয়ালেটে ক্রেডিট যোগ করুন এবং ভ্যালিডেশন শুরু করুন।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Custom Input Card */}
          <Card className="border-primary/20 bg-card shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-black italic flex items-center gap-2">
                কাস্টম ক্রেডিট
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription>ক্রেডিটের পরিমাণ টাইপ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ক্রেডিটের সংখ্যা</label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-16 text-3xl font-code font-black text-primary bg-muted/20 border-white/10 rounded-2xl pl-12 focus:ring-primary"
                    placeholder="৫০০"
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/50" />
                </div>
                <p className="text-[10px] text-muted-foreground font-bold italic uppercase tracking-tighter">নুন্যতম ১০০ ক্রেডিট ক্রয়যোগ্য</p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-xs font-bold uppercase text-primary tracking-widest">মোট মূল্য</p>
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
                <h3 className="text-xl font-black italic">কেন ক্রেডিট কিনবেন?</h3>
                <ul className="space-y-4">
                  {[
                    "কোনো মাসিক সাবস্ক্রিপশন নেই",
                    "ক্রেডিট কখনোই এক্সপায়ার হবে না",
                    "গ্লোবাল ভ্যালিডেশন কভারেজ",
                    "আনলিমিটেড ডাটা এক্সপোর্ট সুবিধা",
                    "রিয়েল-টাইম এপিআই এক্সেস"
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
                    <p className="text-sm font-bold">রেট চার্ট</p>
                    <p className="text-xs text-muted-foreground">$0.05 প্রতি ভেরিফিকেশন ক্রেডিট</p>
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
          <p className="text-xs font-bold uppercase tracking-widest">নিরাপদ এবং এনক্রিপ্টেড পেমেন্ট গেটওয়ে</p>
        </div>
      </div>
    </div>
  );
}
