
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, Copy, Wallet, CreditCard, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const COINS = [
  { id: 'BTC', name: 'Bitcoin', network: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'ETH', name: 'Ethereum', network: 'ETH', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'USDT', name: 'Tether (USDT)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'USDC', name: 'USD Coin (USDC)', network: 'ERC20', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  { id: 'BNB', name: 'BNB', network: 'BSC', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { id: 'DOGE', name: 'Dogecoin', network: 'DOGE', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { id: 'TRX', name: 'Tron (TRX)', network: 'TRC20', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  { id: 'LTC', name: 'Litecoin', network: 'LTC', icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { id: 'SOL', name: 'Solana (SOL)', network: 'SOL', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { id: 'XRP', name: 'Ripple (XRP)', network: 'XRP', icon: 'https://cryptologos.cc/logos/ripple-xrp-logo.png' },
  { id: 'POL', name: 'Polygon (POL)', network: 'POL', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { id: 'TON', name: 'Toncoin (TON)', network: 'TON', icon: 'https://cryptologos.cc/logos/toncoin-ton-logo.png' },
  { id: 'SHIB', name: 'Shiba Inu (SHIB)', network: 'ERC20', icon: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
  { id: 'XMR', name: 'Monero (XMR)', network: 'XMR', icon: 'https://cryptologos.cc/logos/monero-xmr-logo.png' },
  { id: 'DAI', name: 'DAI', network: 'ERC20', icon: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png' },
  { id: 'BCH', name: 'Bitcoin Cash (BCH)', network: 'BCH', icon: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png' },
];

export default function PaymentMethodPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const credits = searchParams.get('credits') || "0";
  const price = searchParams.get('price') || "0";

  const [user, setUser] = useState<any>(null);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handlePayNow = async () => {
    if (!selectedCoin) {
      toast({ variant: "destructive", title: "Selection Missing", description: "দয়া করে একটি কয়েন সিলেক্ট করুন।" });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('https://numcheckr.onrender.com/api/user/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          credits: parseInt(credits), 
          payCurrency: selectedCoin.id, 
          network: selectedCoin.network 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setPaymentData(data);
        toast({ title: "Address Generated", description: "পেমেন্ট অ্যাড্রেস তৈরি হয়েছে।" });
      } else {
        toast({ variant: "destructive", title: "Failed", description: data.message || "Failed to generate address." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Connection failed to server." });
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="rounded-xl border border-white/5"
            onClick={() => router.push("/credits")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calculator
          </Button>
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-2xl font-black italic text-3d">numcheckr</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summary Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-card shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
               <CardHeader>
                 <CardTitle className="text-xl font-black italic uppercase">Order Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Credits</span>
                      </div>
                      <span className="text-xl font-black italic">{credits}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price</span>
                      </div>
                      <span className="text-xl font-black italic text-primary">${price} USD</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User</span>
                      </div>
                      <span className="text-xs font-bold italic truncate ml-2">{user.email}</span>
                    </div>
                 </div>

                 {selectedCoin && !paymentData && (
                   <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-primary">Selected Asset</p>
                     <div className="flex items-center gap-3">
                        <img src={selectedCoin.icon} alt={selectedCoin.name} className="w-10 h-10" />
                        <div>
                           <p className="font-black italic text-lg leading-none">{selectedCoin.name}</p>
                           <p className="text-[10px] font-bold text-muted-foreground">Network: {selectedCoin.network}</p>
                        </div>
                     </div>
                     <Button 
                      onClick={handlePayNow}
                      disabled={isGenerating}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black italic rounded-xl shadow-lg"
                     >
                       {isGenerating ? <Loader2 className="animate-spin" /> : "PAY NOW"}
                     </Button>
                   </div>
                 )}
               </CardContent>
            </Card>

            {paymentData && (
              <Card className="border-green-500/20 bg-green-500/5 shadow-2xl animate-in zoom-in-95">
                <CardHeader>
                   <CardTitle className="text-sm font-black italic flex items-center gap-2 text-green-500">
                     <CheckCircle2 className="h-4 w-4" /> Address Active
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Send Exactly</p>
                      <h3 className="text-3xl font-black italic text-yellow-500">{paymentData.payAmount} {paymentData.payCurrency}</h3>
                   </div>
                   <div className="bg-white p-3 rounded-2xl w-max mx-auto border-4 border-white shadow-xl">
                      <img src={paymentData.qrcode} alt="QR Code" className="w-40 h-40" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Destination Address</p>
                      <div className="relative group">
                        <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-[10px] font-code break-all text-left">
                          {paymentData.address}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:text-primary"
                          onClick={() => copyToClipboard(paymentData.address)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                   </div>
                   <p className="text-[10px] font-bold italic text-muted-foreground animate-pulse">Waiting for blockchain confirmation...</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coin Grid Section */}
          <div className="lg:col-span-2">
             <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Select Payment Method</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Choose a cryptocurrency to complete your purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {COINS.map((coin) => (
                      <div 
                        key={coin.id}
                        onClick={() => {
                          if (!paymentData) setSelectedCoin(coin);
                        }}
                        className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-3 relative overflow-hidden ${
                          selectedCoin?.id === coin.id 
                          ? 'border-primary bg-primary/10 scale-105' 
                          : 'border-white/5 bg-muted/20 hover:border-primary/30 hover:bg-muted/30'
                        } ${paymentData ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {selectedCoin?.id === coin.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <img src={coin.icon} alt={coin.name} className="w-12 h-12 mx-auto drop-shadow-lg group-hover:scale-110 transition-transform" />
                        <div className="space-y-0.5">
                           <p className={`text-xs font-black uppercase tracking-tighter ${selectedCoin?.id === coin.id ? 'text-primary' : ''}`}>
                             {coin.id}
                           </p>
                           <p className="text-[8px] font-bold text-muted-foreground uppercase">{coin.network}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
