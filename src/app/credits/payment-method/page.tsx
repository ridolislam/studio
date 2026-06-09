
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  Wallet, 
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

const COINS = [
  { id: 'BTC', name: 'Bitcoin', network: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'ETH', name: 'Ethereum', network: 'ERC20', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'LTC', name: 'Litecoin', network: 'LTC', icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { id: 'TRX', name: 'Tron (TRX)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  { id: 'USDT', name: 'Tether (USDT)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'TON', name: 'Toncoin', network: 'TON', icon: 'https://cryptologos.cc/logos/toncoin-ton-logo.png' },
  { id: 'SHIB', name: 'Shiba Inu', network: 'ERC20', icon: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
  { id: 'DOGE', name: 'Dogecoin', network: 'DOGE', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { id: 'SOL', name: 'Solana', network: 'SOL', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { id: 'MATIC', name: 'Polygon', network: 'POLYGON', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(parseInt(searchParams.get('credits') || "500"));
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FIXED RATE: $0.0008 per credit (500 credits = $0.40)
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
    if (!selectedCoin) return;
    if (credits < 400) {
      toast({ variant: "destructive", title: "Minimum Requirement", description: "কমপক্ষে ৪০০ ক্রেডিট কিনতে হবে!" });
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    
    try {
      const res = await fetch('https://numcheckr.onrender.com/api/user/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          credits: credits, 
          payCurrency: selectedCoin.id, 
          network: selectedCoin.network 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setPaymentData(data);
        toast({ title: "Invoice Generated", description: "পেমেন্ট অ্যাড্রেস তৈরি হয়েছে।" });
      } else {
        setErrorMsg(`Gateway Error: ${data.message || "Failed to connect"}`);
      }
    } catch (err) {
      setErrorMsg("Gateway Error: Connection failed to server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "অ্যাড্রেস কপি করা হয়েছে।" });
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <Button 
          variant="ghost" 
          className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm hover:bg-white/10"
          onClick={() => router.push("/credits")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="flex items-center gap-3">
          <Logo size={48} />
          <h1 className="text-4xl font-black italic text-3d tracking-tighter">
            num<span className="text-primary">checkr</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-24 border-white/10 bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
            <CardHeader>
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Order Summary</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirm your purchase details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Credits Amount</label>
                  <div className="relative">
                    <Input 
                      id="creditsInput"
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-14 text-2xl font-black italic bg-black/20 border-white/10 rounded-xl pl-12"
                      disabled={!!paymentData}
                    />
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><CreditCard className="h-4 w-4 text-primary" /></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total USD</span>
                  </div>
                  <span className="text-2xl font-black italic text-foreground">${totalPrice}</span>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-white/5 rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account</span>
                    <span className="text-xs font-bold italic truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-xs font-bold text-destructive">{errorMsg}</p>
                </div>
              )}

              {selectedCoin && !paymentData && !errorMsg && (
                <div className="space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={selectedCoin.icon} alt={selectedCoin.name} className="w-8 h-8" />
                      <div>
                        <p className="text-sm font-black italic leading-none">{selectedCoin.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{selectedCoin.network}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <Button 
                    onClick={handlePayNow}
                    disabled={isGenerating || credits < 400}
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-lg font-black italic rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : "PAY NOW"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {paymentData ? (
            <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <CardHeader className="text-center border-b border-white/5 pb-8">
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Payment Initiated</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-green-500/70">Please complete the transaction below</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Send Exactly</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black italic text-yellow-500">{paymentData.payAmount}</h3>
                        <span className="text-xl font-black italic text-muted-foreground">{paymentData.payCurrency}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Wallet Address</p>
                      <div className="relative group">
                        <div className="bg-black/40 p-5 rounded-2xl border border-white/10 text-xs font-code break-all leading-relaxed shadow-inner">
                          {paymentData.address}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:text-primary hover:bg-primary/10 rounded-xl"
                          onClick={() => copyToClipboard(paymentData.address)}
                        >
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      <p className="text-xs font-bold italic text-muted-foreground">Waiting for blockchain confirmation...</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full"></div>
                      <div className="relative bg-white p-4 rounded-3xl border-8 border-white shadow-2xl">
                        {paymentData.qrcode && (
                           <img 
                            src={paymentData.qrcode} 
                            alt="QR Code" 
                            className="w-48 h-48 md:w-64 md:h-64"
                            style={{ display: 'block' }}
                           />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Scan with your wallet <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Select Payment Coin</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Choose your preferred cryptocurrency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {COINS.map((coin) => (
                    <div 
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin)}
                      className={cn(
                        "group p-6 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-4 relative overflow-hidden",
                        selectedCoin?.id === coin.id 
                          ? "border-primary bg-primary/10 scale-105 shadow-[0_0_20px_rgba(113,85,255,0.3)]" 
                          : "border-white/5 bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      {selectedCoin?.id === coin.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <img 
                        src={coin.icon} 
                        alt={coin.name} 
                        className="w-14 h-14 mx-auto drop-shadow-xl group-hover:scale-110 transition-transform duration-300" 
                      />
                      <div className="space-y-1">
                         <p className={cn(
                           "text-sm font-black uppercase tracking-tighter transition-colors",
                           selectedCoin?.id === coin.id ? "text-primary" : "text-foreground"
                         )}>
                           {coin.id}
                         </p>
                         <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{coin.network}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
