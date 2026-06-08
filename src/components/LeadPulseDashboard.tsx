
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  CheckCircle2, 
  Search,
  Zap,
  Globe,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { fetchUserCredits, validateNumber } from "@/app/actions/backend";

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  status: "success" | "invalid";
  timestamp: string;
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push("/login");
      return;
    }
    loadCredits();
  }, [router]);

  const loadCredits = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      const result = await fetchUserCredits(user.id || user._id || user.uid, user.token || '');
      setCredits(result.credits);
    } catch (error) {
      console.error("Failed to load credits", error);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleStart = async () => {
    if (!numberInput.trim()) {
      toast({ variant: "destructive", title: "Input Empty", description: "Please enter numbers to validate." });
      return;
    }

    const numbers = numberInput.split('\n').map(n => n.trim()).filter(n => n !== "");
    
    if (credits < numbers.length) {
      toast({ variant: "destructive", title: "Insufficient Credits", description: `You need ${numbers.length} credits but have ${credits}.` });
      return;
    }

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    for (let i = 0; i < numbers.length; i++) {
      if (!processingRef.current) break;

      try {
        const result = await validateNumber({ 
          number: numbers[i],
          userId: user.id || user._id || user.uid 
        }, user.token || '');

        if (result.success) {
          const data = result.data;
          const newResult: ValidationResult = {
            id: Math.random().toString(36).substr(2, 9),
            number: data.number || numbers[i],
            type: data.type || "Unknown",
            carrier: data.carrier || "Unknown",
            location: data.location || "Unknown",
            status: "success",
            timestamp: new Date().toISOString()
          };

          setResults(prev => [newResult, ...prev]);
          setCredits(prev => Math.max(0, prev - 1));
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } catch (error) {
        console.error(`Error validating ${numbers[i]}`, error);
      }

      setProgress(Math.round(((i + 1) / numbers.length) * 100));
    }

    setIsProcessing(false);
    processingRef.current = false;
    toast({ title: "Processing Complete", description: `Finished processing requests.` });
  };

  const handleStop = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-primary/20 bg-card shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Input Numbers</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Textarea 
              placeholder="Enter phone numbers (one per line)..."
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              className="min-h-[250px] font-code text-sm border-white/10 rounded-xl"
              disabled={isProcessing}
            />

            <div className="grid grid-cols-2 gap-3">
              <Button 
                disabled={isProcessing || !numberInput.trim()} 
                onClick={handleStart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                <Play className="h-4 w-4 mr-2" /> Start
              </Button>
              <Button 
                disabled={!isProcessing} 
                onClick={handleStop}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Square className="h-4 w-4 mr-2" /> Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">Wallet Balance</span>
            </div>
            {isLoadingCredits ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span id="creditBalance" className="text-2xl font-black text-primary font-code">{credits}</span>
            )}
          </div>
        </Card>
      </div>

      <div className="xl:col-span-3 space-y-6">
        <div className="space-y-2 bg-card/50 p-4 rounded-xl border border-muted shadow-inner">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter px-1">
            <span className="text-muted-foreground">{isProcessing ? "Validator Engine Active" : "Engine Standby"}</span>
            <span className="text-primary font-code">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-card border-muted shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-muted bg-muted/5">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="font-bold">Number</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Carrier</TableHead>
                    <TableHead className="font-bold">Location</TableHead>
                    <TableHead className="text-right font-bold">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody id="resultBody">
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground opacity-50">
                        <Search className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                        <p>No results yet. Click start to begin validation.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((res) => (
                      <TableRow key={res.id} className="hover:bg-primary/5 transition-all">
                        <TableCell className="font-code font-bold text-primary">{res.number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{res.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{res.carrier}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" /> {res.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-code text-muted-foreground">
                          {new Date(res.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
