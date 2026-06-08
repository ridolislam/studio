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
  Download,
  Upload,
  FileText,
  Smartphone,
  Phone,
  AlertCircle,
  Link as LinkIcon
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
import { extractAIData } from "@/ai/flows/ai-data-extraction";
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  
  // Categorized counts
  const [counts, setCounts] = useState({
    mobile: 0,
    landline: 0,
    invalid: 0,
    links: 0
  });

  const { toast } = useToast();
  const router = useRouter();
  const processingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = async (event) => {
      const content = event.target?.result;
      if (!content) return;

      setIsExtracting(true);
      toast({ title: "Processing File", description: "Extracting leads using smart AI..." });

      let textToExtract = "";

      if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(content, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        textToExtract = XLSX.utils.sheet_to_txt(sheet);
      } else if (extension === 'csv' || extension === 'txt') {
        textToExtract = content.toString();
      }

      try {
        const extracted = await extractAIData({ 
          fileContent: textToExtract, 
          fileName: file.name 
        });

        const numbers = extracted.phoneNumbers.join('\n');
        setNumberInput(prev => prev ? prev + '\n' + numbers : numbers);
        setCounts(prev => ({ ...prev, links: prev.links + extracted.sourceLinks.length }));

        toast({ 
          title: "Extraction Success", 
          description: `Found ${extracted.phoneNumbers.length} numbers and ${extracted.sourceLinks.length} links.` 
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Extraction Error", description: "AI could not parse this file." });
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleStart = async () => {
    const lines = numberInput.split('\n').map(n => n.trim()).filter(n => n !== "");
    
    if (lines.length === 0) {
      toast({ variant: "destructive", title: "Input Empty", description: "Please enter or upload numbers." });
      return;
    }

    if (credits < lines.length) {
      toast({ variant: "destructive", title: "Insufficient Credits", description: `Required: ${lines.length}, Available: ${credits}` });
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
          const type = data.line_type?.toLowerCase() || "unknown";
          
          const newResult: ValidationResult = {
            id: Math.random().toString(36).substr(2, 9),
            number: data.number || lines[i],
            type: data.line_type || "Invalid",
            carrier: data.carrier || "N/A",
            location: data.location || "N/A",
            status: data.valid ? "success" : "invalid",
            timestamp: new Date().toISOString()
          };

          setResults(prev => [newResult, ...prev]);

          // Update counts
          if (!data.valid) {
            setCounts(prev => ({ ...prev, invalid: prev.invalid + 1 }));
          } else if (type.includes("mobile")) {
            setCounts(prev => ({ ...prev, mobile: prev.mobile + 1 }));
          } else {
            setCounts(prev => ({ ...prev, landline: prev.landline + 1 }));
          }
          
          if (result.remainingCredits !== undefined) {
            setCredits(result.remainingCredits);
            const updatedUser = { ...user, credits: result.remainingCredits };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error(`Error validating ${lines[i]}`, error);
      }

      setProgress(Math.round(((i + 1) / lines.length) * 100));
    }

    setIsProcessing(false);
    processingRef.current = false;
    toast({ title: "Task Completed", description: "Finished processing the list." });
  };

  const handleStop = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  const downloadCategory = (category: string) => {
    let filtered;
    if (category === 'mobile') filtered = results.filter(r => r.type.toLowerCase().includes('mobile'));
    else if (category === 'landline') filtered = results.filter(r => r.type.toLowerCase().includes('landline'));
    else if (category === 'invalid') filtered = results.filter(r => r.status === 'invalid');
    else filtered = results;

    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: `No ${category} leads to download.` });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filtered.map(r => ({
      Number: r.number,
      Type: r.type,
      Carrier: r.carrier,
      Location: r.location,
      Date: new Date(r.timestamp).toLocaleString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, category.toUpperCase());
    XLSX.writeFile(wb, `numcheckr_${category}_leads.xlsx`);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Left Sidebar: Control & Input */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-primary/20 bg-card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
              Lead Input
              {isExtracting && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl border-dashed border-primary/30 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" /> Upload File
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".xlsx,.xls,.csv,.txt"
              />
            </div>

            <Textarea 
              placeholder="Paste numbers or upload file..."
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              className="min-h-[250px] font-code text-xs bg-muted/20 border-white/5 rounded-2xl"
              disabled={isProcessing}
            />

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleStart} disabled={isProcessing} className="h-12 bg-primary font-black italic rounded-xl">
                <Play className="h-4 w-4 mr-2" /> START
              </Button>
              <Button onClick={handleStop} disabled={!isProcessing} variant="outline" className="h-12 border-destructive/30 text-destructive rounded-xl">
                <Square className="h-4 w-4 mr-2" /> STOP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Card */}
        <Card className="bg-primary/5 border-primary/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-primary/70">Balance</p>
              <h2 className="text-4xl font-black italic">{credits}</h2>
            </div>
            <Zap className="h-10 w-10 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Main Content: Stats & Table */}
      <div className="xl:col-span-3 space-y-6">
        {/* Status Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => downloadCategory('mobile')} className="group">
            <Card className="border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all cursor-pointer p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-green-500">Mobile</p>
                <h3 className="text-3xl font-black italic">{counts.mobile}</h3>
              </div>
              <Smartphone className="h-8 w-8 text-green-500 opacity-20 group-hover:opacity-50 transition-all" />
            </Card>
          </button>
          
          <button onClick={() => downloadCategory('landline')} className="group">
            <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-500">Landline</p>
                <h3 className="text-3xl font-black italic">{counts.landline}</h3>
              </div>
              <Phone className="h-8 w-8 text-blue-500 opacity-20 group-hover:opacity-50 transition-all" />
            </Card>
          </button>

          <button onClick={() => downloadCategory('invalid')} className="group">
            <Card className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-red-500">Invalid</p>
                <h3 className="text-3xl font-black italic">{counts.invalid}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-20 group-hover:opacity-50 transition-all" />
            </Card>
          </button>

          <Card className="border-primary/20 bg-primary/5 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-primary">Links</p>
              <h3 className="text-3xl font-black italic">{counts.links}</h3>
            </div>
            <LinkIcon className="h-8 w-8 text-primary opacity-20" />
          </Card>
        </div>

        {/* Progress */}
        <div className="bg-card/40 p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span>{isProcessing ? "Validating Engine..." : "Ready to process"}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted/30" />
        </div>

        {/* Intelligence Table */}
        <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-white/5 bg-muted/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Intelligence Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => downloadCategory('all')} disabled={results.length === 0}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setResults([]); setCounts({mobile:0,landline:0,invalid:0,links:0}); setProgress(0); }} disabled={results.length === 0}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-10">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Number</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center opacity-20">
                        <Search className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                        <p className="font-black italic uppercase tracking-widest">Waiting for Leads</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((res) => (
                      <TableRow key={res.id} className="border-white/5 hover:bg-primary/5 transition-colors">
                        <TableCell className="font-code font-bold text-primary">{res.number}</TableCell>
                        <TableCell>
                          <Badge className={`${res.status === 'invalid' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'} border-none text-[9px] font-black uppercase`}>
                            {res.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold">{res.carrier}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{res.location}</TableCell>
                        <TableCell className="text-right font-code text-[10px] text-muted-foreground">
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
