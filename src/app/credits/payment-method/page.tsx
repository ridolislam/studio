"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  CreditCard, 
  Mail, 
  Zap,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createOxapayInvoice } from "@/app/actions/backend";
import { Badge } from "@/components/ui/badge";

const COINS = [
  { id: 'USDT', name: 'Tether (USDT)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'BTC', name: 'Bitcoin', network: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'ETH', name: 'Ethereum', network: 'ERC20', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'LTC', name: 'Litecoin', network: 'LTC', icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { id: 'TRX', name: 'Tron (TRX)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(parseInt(searchParams.get('credits') || "500"));
  const [selectedCoin, setSelectedCoin] = useState<any>(COINS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const PRICE_PER_CREDIT = 0.0008; 
  const totalPrice = (credits * PRICE_PER_CREDIT).toFixed(4);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handlePayNow = async () => {
    if (!selectedCoin || !user) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await createOxapayInvoice({ 
        email: user.email, 
        credits, 
        payCurrency: selectedCoin.id, 
        network: selectedCoin.network 
      });
      if (res.success) {
        setPaymentData(res);
        toast({ title: "Invoice Created", description: "Payment address is ready." });
      } else {
        setErrorMsg(res.message || "Failed to initiate payment");
      }
    } catch (err) {
      setErrorMsg("Gateway Error: Connection failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Wallet address copied." });
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="rounded-xl border border-white/5" onClick={() => router.push("/credits")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <h1 className="text-3xl font-black italic text-3d tracking-tighter uppercase">numcheckr</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="border-white/10 bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <CardHeader>
              <CardTitle className="text-xl font-black italic uppercase">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black uppercase opacity-50">Quantity</span>
                   <Badge variant="outline" className="bg-primary text-white border-none">{credits} Credits</Badge>
                 </div>
                 <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black italic">${totalPrice}</span>
                   <span className="text-xs font-bold uppercase opacity-50">USD</span>
                 </div>
              </div>

              {!paymentData && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Select Currency</p>
                  <div className="grid grid-cols-1 gap-2">
                    {COINS.map(coin => (
                      <div 
                        key={coin.id} 
                        onClick={() => setSelectedCoin(coin)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                          selectedCoin?.id === coin.id ? "border-primary bg-primary/10" : "border-white/5 bg-muted/20 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <img src={coin.icon} className="w-6 h-6" alt="" />
                          <span className="font-black italic uppercase">{coin.name}</span>
                        </div>
                        <span className="text-[9px] font-bold opacity-50">{coin.network}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handlePayNow} disabled={isGenerating} className="w-full h-16 bg-primary text-lg font-black italic rounded-xl">
                    {isGenerating ? <Loader2 className="animate-spin" /> : "GENERATE ADDRESS"}
                  </Button>
                </div>
              )}

              {errorMsg && <div className="p-4 bg-destructive/10 text-destructive text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse"><AlertCircle className="h-4 w-4" /> {errorMsg}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {paymentData ? (
            <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-xl shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-500">
               <div className="text-center mb-12">
                  <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Awaiting Transaction</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase opacity-60">Amount to send</p>
                      <h3 className="text-4xl font-black italic text-primary">{paymentData.payAmount} <span className="text-xl text-muted-foreground">{paymentData.payCurrency}</span></h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase opacity-60">Wallet Address</p>
                      <div className="relative group">
                        <div className="bg-black/40 p-5 rounded-xl border border-white/10 text-xs font-code break-all shadow-inner">{paymentData.address}</div>
                        <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => copyToClipboard(paymentData.address)}><Copy className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 animate-pulse">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monitoring blockchain...</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-white rounded-3xl border-8 border-white shadow-2xl">
                       <img src={paymentData.qrcode} className="w-48 h-48 md:w-64 md:h-64" alt="QR" />
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase opacity-50 flex items-center gap-2">Secure Oxapay Link <ExternalLink className="h-3 w-3" /></p>
                  </div>
               </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl p-20">
               <Zap className="h-20 w-20 mb-4" />
               <p className="font-black italic uppercase tracking-widest text-xl">Select Coin to Begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
