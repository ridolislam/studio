
"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowLeft, Loader2, Calculator, Bitcoin, ShieldCheck, X, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const COINS = [
  { id: 'LTC', name: 'Litecoin', network: 'LTC', icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { id: 'TRX', name: 'Tron (TRX)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  { id: 'USDT', name: 'USDT (TRC20)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'DOGE', name: 'Dogecoin', network: 'DOGE', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { id: 'BTC', name: 'Bitcoin', network: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'TON', name: 'Toncoin', network: 'TON', icon: 'https://cryptologos.cc/logos/toncoin-ton-logo.png' },
];

export default function CreditsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [creditAmount, setCreditAmount] = useState<number>(400);
  const [isMounted, setIsMounted] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const RATE_PER_CREDIT = 0.0008; 
  const totalPrice = (creditAmount * RATE_PER_CREDIT).toFixed(4);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenPayment = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      toast({ variant: "destructive", title: "Authentication Required", description: "দয়া করে প্রথমে লগইন করুন!" });
      router.push("/login");
      return;
    }
    setIsModalOpen(true);
    setPaymentData(null);
    setSelectedCoin(null);
  };

  const requestPaymentAddress = async () => {
    if (!selectedCoin) {
      toast({ variant: "destructive", title: "Error", description: "দয়া করে একটি কয়েন সিলেক্ট করুন!" });
      return;
    }
    if (creditAmount < 400) {
      toast({ variant: "destructive", title: "Minimum Requirement", description: "কমপক্ষে ৪০০ ক্রেডিট কিনতে হবে!" });
      return;
    }

    const userData = localStorage.getItem('user');
    if (!userData) return;
    const user = JSON.parse(userData);

    setIsGenerating(true);
    try {
      const res = await fetch('https://numcheckr.onrender.com/api/user/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          credits: creditAmount, 
          payCurrency: selectedCoin, 
          network: selectedNetwork 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setPaymentData(data);
      } else {
        toast({ variant: "destructive", title: "Failed", description: data.message || "পেমেন্ট অ্যাড্রেস তৈরি করা সম্ভব হয়নি।" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে।" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "অ্যাড্রেস কপি করা হয়েছে।" });
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
                    min={400}
                    step={100}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Min 400</span>
                    <span className="text-primary/70">Control slider</span>
                    <span>Max 100k</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-8">
              <Button 
                onClick={handleOpenPayment}
                className="w-full h-20 text-xl md:text-2xl font-black italic bg-gradient-to-r from-white to-primary text-slate-900 rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse-zoom"
              >
                <Bitcoin className="h-8 w-8" />
                PAY WITH CRYPTO
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
                ২. আপনার পছন্দের ক্রিপ্টো কারেন্সি সিলেক্ট করুন।<br/>
                ৩. পেমেন্ট অ্যাড্রেসে সঠিক পরিমাণ কয়েন পাঠান।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-[#0f172a] border-[#38bdf8]/30 text-white rounded-3xl overflow-hidden p-0">
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic text-center uppercase tracking-tighter">
                {paymentData ? "Payment Details" : "Select Payment Method"}
              </DialogTitle>
              <DialogDescription className="text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                {paymentData ? "Send exactly as shown to complete purchase" : "Choose your preferred cryptocurrency"}
              </DialogDescription>
            </DialogHeader>

            {!paymentData ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {COINS.map((coin) => (
                    <div 
                      key={coin.id}
                      onClick={() => {
                        setSelectedCoin(coin.id);
                        setSelectedNetwork(coin.network);
                      }}
                      className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-3 ${
                        selectedCoin === coin.id 
                        ? 'border-[#38bdf8] bg-[#1e293b] scale-105' 
                        : 'border-slate-800 bg-slate-900/50 hover:border-[#38bdf8]/50'
                      }`}
                    >
                      <img src={coin.icon} alt={coin.name} className="w-12 h-12 mx-auto drop-shadow-lg" />
                      <p className={`text-xs font-black uppercase tracking-tighter ${selectedCoin === coin.id ? 'text-[#38bdf8]' : 'text-slate-400'}`}>
                        {coin.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount to buy:</span>
                    <span className="text-2xl font-black italic text-[#38bdf8]">{creditAmount} Credits</span>
                  </div>
                  
                  <Button 
                    onClick={requestPaymentAddress}
                    disabled={isGenerating || !selectedCoin}
                    className="w-full h-16 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-black text-lg italic rounded-2xl shadow-lg shadow-[#38bdf8]/20 transition-all"
                  >
                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : "GET PAYMENT ADDRESS"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-slate-900/50 border border-[#38bdf8]/20 rounded-3xl p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Send Exactly</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-black italic text-yellow-400">{paymentData.payAmount}</span>
                      <span className="text-xl font-black italic text-yellow-400/70">{paymentData.payCurrency}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wallet Address</p>
                     <div className="relative group">
                        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700 text-xs font-code break-all select-all pr-12">
                          {paymentData.address}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => copyToClipboard(paymentData.address)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-[#38bdf8]"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl w-max mx-auto shadow-2xl border-4 border-white">
                    <img src={paymentData.qrcode} alt="Payment QR" className="w-48 h-48" />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[#4ade80] font-bold italic animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Waiting for network confirmation...</span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-white font-bold"
                >
                  Cancel and Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
