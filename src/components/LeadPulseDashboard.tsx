"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  CheckCircle2, 
  Search,
  Zap,
  Globe,
  Loader2,
  Trash2,
  Download
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
import { validateNumber } from "@/app/actions/backend";
import * as XLSX from 'xlsx';

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
    const user = JSON.parse(userStr);
    setCredits(user.credits || 0);
    setIsLoadingCredits(false);
  }, [router]);

  const handleStart = async () => {
    const lines = numberInput.split('\n').map(n => n.trim()).filter(n => n !== "");
    
    if (lines.length === 0) {
      toast({ variant: "destructive", title: "Input Empty", description: "Please enter numbers to validate." });
      return;
    }

    if (credits < lines.length) {
      toast({ variant: "destructive", title: "Insufficient Credits", description: `You need ${lines.length} credits but have ${credits}.` });
      return;
    }

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    for (let i = 0; i < lines.length; i++) {
      if (!processingRef.current) break;

      try {
        const result = await validateNumber({ 
          email: user.email,
          number: lines[i]
        });

        if (result.success) {
          const data = result.data;
          const newResult: ValidationResult = {
            id: Math.random().toString(36).substr(2, 9),
            number: data.number || lines[i],
            type: data.line_type || "Unknown",
            carrier: data.carrier || "Unknown",
            location: data.location || "Unknown",
            status: "success",
            timestamp: new Date().toISOString()
          };

          setResults(prev => [newResult, ...prev]);
          
          if (result.remainingCredits !== undefined) {
            setCredits(result.remainingCredits);
            const updatedUser = { ...user, credits: result.remainingCredits };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          toast({ variant: "destructive", title: "Validation Error", description: result.message });
          if (result.message === "No Credits") {
            processingRef.current = false;
            break;
          }
        }
      } catch (error) {
        console.error(`Error validating ${lines[i]}`, error);
      }

      setProgress(Math.round(((i + 1) / lines.length) * 100));
    }

    setIsProcessing(false);
    processingRef.current = false;
    toast({ title: "Task Completed", description: `Finished processing ${lines.length} numbers.` });
  };

  const handleStop = () => {
    processingRef.current = false;
    setIsProcessing(false);
    toast({ title: "Process Stopped", description: "Validation task has been cancelled." });
  };

  const clearResults = () => {
    setResults([]);
    setProgress(0);
    toast({ title: "Results Cleared" });
  };

  const exportToExcel = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(results.map(r => ({
      Number: r.number,
      Type: r.type,
      Carrier: r.carrier,
      Location: r.location,
      Time: new Date(r.timestamp).toLocaleString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Validation Results");
    XLSX.writeFile(workbook, "numcheckr_results.xlsx");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-primary/20 bg-card shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
              Input Leads
              <Zap className="h-3 w-3 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Textarea 
                placeholder="Enter numbers (one per line)..."
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value)}
                className="min-h-[300px] font-code text-sm border-white/5 bg-muted/20 rounded-2xl focus:ring-primary/30 transition-all resize-none"
                disabled={isProcessing}
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-bold opacity-30 pointer-events-none">
                {numberInput.split('\n').filter(n => n.trim()).length} Leads
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                disabled={isProcessing || !numberInput.trim()} 
                onClick={handleStart}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic rounded-xl shadow-lg active:translate-y-1 transition-all"
              >
                <Play className="h-4 w-4 mr-2" /> START
              </Button>
              <Button 
                disabled={!isProcessing} 
                onClick={handleStop}
                variant="outline"
                className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-black italic rounded-xl transition-all"
              >
                <Square className="h-4 w-4 mr-2" /> STOP
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Zap className="h-24 w-24 text-primary" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Available Credits</p>
              {isLoadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground italic tracking-tighter">{credits}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">CRD</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
               <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-3 space-y-6">
        <div className="space-y-3 bg-card/40 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-sm">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
            <span className={isProcessing ? "text-primary animate-pulse" : "text-muted-foreground"}>
              {isProcessing ? "Validator Engine Active" : "System Standby"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-primary font-code">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2.5 bg-muted/30" />
        </div>

        <Card className="bg-card border-white/5 shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-white/5 bg-muted/5 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 
              Validation Intelligence
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={exportToExcel}
                disabled={results.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={clearResults}
                disabled={results.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[650px] overflow-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-20 shadow-sm">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Number</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status/Type</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Carrier Network</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Location</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-4">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-96 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                          <Search className="h-16 w-16 mb-2 animate-bounce" />
                          <p className="font-black italic uppercase tracking-tighter text-xl">Waiting for Input</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((res) => (
                      <TableRow key={res.id} className="border-white/5 hover:bg-primary/5 transition-colors group">
                        <TableCell className="font-code font-bold text-primary group-hover:scale-105 transition-transform origin-left">{res.number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                            {res.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground/80">{res.carrier}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                            <Globe className="h-3 w-3 text-primary/50" /> {res.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-code font-bold text-muted-foreground">
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
