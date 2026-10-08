"use client";

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Terminal, Shield, Zap, Globe, Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">v4 API Documentation</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-3d tracking-tighter uppercase leading-none">Developer <span className="text-primary">Hub</span></h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Integrate numcheckr's distributed AI validation engine into your own workflow. Support for Server 1 (Standard) and Server 2 (PV) is now global.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Zap /></div>
            <h3 className="font-black italic uppercase text-lg">Parallel Cycles</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Server 2 uses parallel key groups to process large lists with zero wait time.</p>
          </Card>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform"><Globe /></div>
            <h3 className="font-black italic uppercase text-lg">Global Regions</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Customize your request latency by selecting from 3 optimized API regions.</p>
          </Card>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl p-8 space-y-4 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><Shield /></div>
            <h3 className="font-black italic uppercase text-lg">Anti-Fraud Layer</h3>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">Built-in detection for burner numbers, VOIP, and non-residential lines.</p>
          </Card>
        </section>

        <section className="space-y-8">
          <Card className="border-white/5 bg-black/40 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">API Authentication</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mt-1">Endpoint: https://numcheckr.onrender.com</CardDescription>
              </div>
              <Terminal className="h-8 w-8 text-primary opacity-50" />
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
                 <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   Every request requires a valid API key passed in the <code className="text-primary font-black px-1.5 py-0.5 bg-primary/10 rounded">x-api-key</code> header. Each successful validation costs 1 credit. Failed items are automatically refunded.
                 </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">cURL Request Example</h4>
                  <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] font-black px-2 py-0.5">POST JSON</Badge>
                </div>
                <div className="relative group">
                  <div className="bg-black/60 p-8 rounded-2xl border border-white/10 font-code text-sm text-green-400 overflow-x-auto shadow-inner leading-relaxed">
                    {curlExample}
                  </div>
                  <Button size="icon" variant="ghost" className="absolute right-4 top-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl" onClick={() => handleCopy(curlExample)}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center">Response Normalization</h2>
            <Tabs defaultValue="v2" className="w-full">
              <TabsList className="bg-card/60 p-1 rounded-2xl h-14 mb-8 w-fit mx-auto border border-white/5">
                <TabsTrigger value="v2" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary">Server 2 Response</TabsTrigger>
                <TabsTrigger value="v1" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary">Server 1 Response</TabsTrigger>
              </TabsList>
              
              <TabsContent value="v2">
                <Card className="border-white/5 bg-black/20 rounded-[2rem] p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                     <Badge className="bg-accent/10 text-accent border-none font-black italic px-3 py-1">V4 ENGINE</Badge>
                     <p className="text-xs font-bold text-muted-foreground uppercase">Phone Validator v4 Output Format</p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-2xl border border-white/10 font-code text-[11px] text-primary overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "results": [
    {
      "number": "+14155552671",
      "status": "success",
      "data": {
        "valid": true,
        "country_code": "US",
        "country_name": "United States",
        "location": "San Francisco, CA",
        "carrier": "Verizon Wireless",
        "line_type": "mobile",
        "provider": "phonevalidator",
        "phonevalidator": {
          "fake_number": "NO",
          "fake_reason": "",
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
                <Card className="border-white/5 bg-black/20 rounded-[2rem] p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                     <Badge className="bg-primary/10 text-primary border-none font-black italic px-3 py-1">V1 ENGINE</Badge>
                     <p className="text-xs font-bold text-muted-foreground uppercase">Numverify Standard Output Format</p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-2xl border border-white/10 font-code text-[11px] text-primary overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "results": [
    {
      "number": "+14158586273",
      "status": "success",
      "data": {
        "valid": true,
        "international_format": "+14158586273",
        "country_prefix": "+1",
        "country_code": "US",
        "country_name": "United States of America",
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
          </div>
        </section>

        <section className="bg-primary/5 p-12 rounded-[3rem] border border-primary/10 text-center space-y-6">
           <h3 className="text-3xl font-black italic uppercase tracking-tighter">Need custom integration?</h3>
           <p className="text-muted-foreground font-medium max-w-xl mx-auto">
             For high-volume enterprise needs or custom endpoint requirements, reach out to our support team on WhatsApp.
           </p>
           <Button onClick={() => window.open('https://wa.me/qr/X3XUFT7RDTI2I1', '_blank')} className="h-14 px-10 rounded-2xl font-black italic bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20">
             CONTACT SUPPORT
           </Button>
        </section>
      </main>
    </div>
  );
}
