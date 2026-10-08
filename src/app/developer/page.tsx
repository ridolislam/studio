"use client";

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Terminal, Shield, Zap, Globe, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperPage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied", description: "Code snippet copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST https://numcheckr.onrender.com/api/v1/validate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: nc_YOUR_API_KEY" \\
  -d '{
    "numbers": ["+14155552671", "+8801712345678"],
    "region": "1"
  }'`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-20 max-w-5xl space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">For Developers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase">API Documentation</h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Integrate numcheckr's powerful AI validation engine into your own applications with our robust REST API.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-6 space-y-4">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Zap /></div>
            <h3 className="font-black italic uppercase">Fast Streaming</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Server 2 uses distributed parallel workers for ultra-fast batch processing.</p>
          </Card>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-6 space-y-4">
            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent"><Globe /></div>
            <h3 className="font-black italic uppercase">Global Regions</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Choose from 3 validation regions to optimize for latency and coverage.</p>
          </Card>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-6 space-y-4">
            <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><Shield /></div>
            <h3 className="font-black italic uppercase">Fraud Protection</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Identify fake numbers and burner lines with specialized Server 2 detection.</p>
          </Card>
        </section>

        <section className="space-y-8">
          <Card className="border-white/5 bg-black/40 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black italic uppercase">Authentication</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Base URL: https://numcheckr.onrender.com</CardDescription>
              </div>
              <Terminal className="h-8 w-8 text-primary opacity-50" />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every request requires a valid API key passed in the <code className="text-primary font-bold">x-api-key</code> header. 
                You can generate your key in the dashboard profile section.
              </p>
              <div className="relative group">
                <div className="bg-black/60 p-6 rounded-2xl border border-white/10 font-code text-xs text-green-400 overflow-x-auto">
                  {curlExample}
                </div>
                <Button size="icon" variant="ghost" className="absolute right-4 top-4 text-white/50 hover:text-white" onClick={() => handleCopy(curlExample)}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="v4" className="w-full">
            <TabsList className="bg-card/60 p-1 rounded-xl h-12 mb-6">
              <TabsTrigger value="v4" className="rounded-lg px-8 font-black uppercase italic text-[10px]">Server 2 (PV V4)</TabsTrigger>
              <TabsTrigger value="v1" className="rounded-lg px-8 font-black uppercase italic text-[10px]">Server 1 (Numverify)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="v4">
              <Card className="border-white/5 bg-black/20 rounded-3xl p-8 space-y-6">
                <h4 className="font-black italic uppercase text-accent">Server 2 Normalized Response</h4>
                <div className="bg-black/60 p-6 rounded-2xl border border-white/10 font-code text-[11px] text-primary overflow-x-auto">
{`{
  "success": true,
  "results": [
    {
      "number": "+14155552671",
      "status": "success",
      "data": {
        "valid": true,
        "country_code": "US",
        "location": "San Francisco, CA",
        "carrier": "Verizon Wireless",
        "line_type": "mobile",
        "provider": "phonevalidator",
        "phonevalidator": {
          "fake_number": "NO",
          "outside_us": "NO"
        }
      }
    }
  ]
}`}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="v1">
              <Card className="border-white/5 bg-black/20 rounded-3xl p-8 space-y-6">
                <h4 className="font-black italic uppercase text-primary">Server 1 Standard Response</h4>
                <div className="bg-black/60 p-6 rounded-2xl border border-white/10 font-code text-[11px] text-primary overflow-x-auto">
{`{
  "success": true,
  "results": [
    {
      "number": "+14158586273",
      "status": "success",
      "data": {
        "valid": true,
        "international_format": "+14158586273",
        "country_name": "United States",
        "carrier": "AT&T Mobility LLC",
        "line_type": "mobile"
      }
    }
  ]
}`}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
