
"use client";

import React, { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Play, 
  Square, 
  Upload, 
  Download, 
  Phone, 
  Building2, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { extractAIData } from "@/ai/flows/ai-data-extraction";

interface Lead {
  id: string;
  sourceLink: string;
  phoneNumber: string;
  businessName: string;
  type: "Mobile" | "Landline" | "Invalid";
  timestamp: string;
}

interface ProcessingLog {
  id: string;
  message: string;
  status: "success" | "error" | "info";
  time: string;
}

export default function LeadPulseDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const { toast } = useToast();
  
  const processingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((message: string, status: "success" | "error" | "info" = "info") => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      message,
      status,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 50));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      addLog(`File uploaded: ${uploadedFile.name}`, "success");
      toast({
        title: "File Uploaded",
        description: `${uploadedFile.name} is ready for processing.`,
      });
    }
  };

  const classifyPhone = (phone: string): "Mobile" | "Landline" | "Invalid" => {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length < 5) return "Invalid";
    if (clean.startsWith("01") && clean.length === 11) return "Mobile";
    if (clean.startsWith("8801") && clean.length === 13) return "Mobile";
    if (clean.length >= 6 && clean.length <= 10) return "Landline";
    return "Invalid";
  };

  const startProcessing = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a .xlsx, .xls, .csv, or .txt file first.",
      });
      return;
    }

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);
    addLog("Starting extraction process...", "info");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        let textContent = "";

        if (file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
          textContent = content as string;
        } else {
          const workbook = XLSX.read(content, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          textContent = XLSX.utils.sheet_to_txt(firstSheet);
        }

        const chunks = textContent.match(/.{1,2000}/gs) || [textContent];
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i++) {
          if (!processingRef.current) break;

          try {
            const extracted = await extractAIData({
              fileContent: chunks[i],
              fileName: file.name
            });

            const newLeads: Lead[] = [];
            const maxLength = Math.max(
              extracted.businessNames.length, 
              extracted.phoneNumbers.length, 
              extracted.sourceLinks.length
            );

            for (let j = 0; j < maxLength; j++) {
              const phone = extracted.phoneNumbers[j] || "N/A";
              newLeads.push({
                id: Math.random().toString(36).substr(2, 9),
                businessName: extracted.businessNames[j] || "Unknown Business",
                phoneNumber: phone,
                sourceLink: extracted.sourceLinks[j] || "N/A",
                type: classifyPhone(phone),
                timestamp: new Date().toISOString()
              });
            }

            setLeads(prev => [...newLeads, ...prev]);
            setProgress(Math.round(((i + 1) / totalChunks) * 100));
            addLog(`Processed chunk ${i + 1}/${totalChunks}. Found ${newLeads.length} leads.`, "success");
          } catch (err) {
            addLog(`Error processing chunk ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
          }
        }

        setIsProcessing(false);
        processingRef.current = false;
        addLog("Processing complete.", "success");
        toast({
          title: "Extraction Finished",
          description: "All data has been processed and categorized.",
        });
      };

      if (file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }

    } catch (error) {
      setIsProcessing(false);
      processingRef.current = false;
      addLog("Failed to initiate processing.", "error");
    }
  };

  const stopProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);
    addLog("Process stopped by user.", "info");
  };

  const downloadCategory = (category: "Mobile" | "Landline" | "Invalid") => {
    const filteredLeads = leads.filter(l => l.type === category);
    if (filteredLeads.length === 0) {
      toast({
        title: "No data to export",
        description: `There are no ${category} leads to download.`,
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredLeads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, category);
    XLSX.writeFile(workbook, `LeadPulse_${category}_${new Date().getTime()}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `${category} leads exported to Excel.`,
    });
  };

  const stats = {
    total: leads.length,
    mobile: leads.filter(l => l.type === "Mobile").length,
    landline: leads.filter(l => l.type === "Landline").length,
    invalid: leads.filter(l => l.type === "Invalid").length,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Left Sidebar: Controls & Analytics */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-primary/20 bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-sm font-headline uppercase tracking-widest text-primary">Controls</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/20 text-center gap-2 group"
            >
              <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium">{file ? file.name : "Choose File"}</p>
              <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv, .txt</p>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv,.txt"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                disabled={isProcessing || !file} 
                onClick={startProcessing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Play className="h-4 w-4 mr-2" /> Start
              </Button>
              <Button 
                disabled={!isProcessing} 
                onClick={stopProcessing}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              >
                <Square className="h-4 w-4 mr-2" /> Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Counters Mini Boxes */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-card border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-sm hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Mobile</span>
            </div>
            <span className="text-xl font-code font-bold text-primary">{stats.mobile}</span>
          </div>

          <div className="bg-card border border-accent/20 rounded-xl p-4 flex items-center justify-between shadow-sm hover:bg-accent/5 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Landline</span>
            </div>
            <span className="text-xl font-code font-bold text-accent">{stats.landline}</span>
          </div>

          <div className="bg-card border border-destructive/20 rounded-xl p-4 flex items-center justify-between shadow-sm hover:bg-destructive/5 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Invalid</span>
            </div>
            <span className="text-xl font-code font-bold text-destructive">{stats.invalid}</span>
          </div>
        </div>

        <Card className="border-muted bg-card shadow-lg h-[250px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-headline uppercase tracking-widest">Operation Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-2 px-0">
            <ScrollArea className="h-[180px] px-4">
              <div className="space-y-3">
                {logs.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-8">Waiting for input...</p>}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs border-b border-muted/30 pb-2">
                    <span className="text-muted-foreground font-code shrink-0">{log.time}</span>
                    <span className={log.status === 'success' ? 'text-green-500' : log.status === 'error' ? 'text-destructive' : 'text-foreground'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Stats, Status & Table */}
      <div className="xl:col-span-3 space-y-6">
        {/* Status Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            onClick={() => downloadCategory("Mobile")}
            className="group cursor-pointer hover:border-primary transition-all duration-300 bg-card overflow-hidden"
          >
            <div className="h-1 w-full bg-primary" />
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mobile Leads</p>
                <h3 className="text-3xl font-code font-bold text-primary group-hover:scale-105 transition-transform">{stats.mobile}</h3>
              </div>
              <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Phone className="h-6 w-6" />
              </div>
            </CardContent>
            <div className="px-6 pb-4 flex justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                <Download className="h-3 w-3" /> Auto Download XLSX
              </span>
            </div>
          </Card>

          <Card 
            onClick={() => downloadCategory("Landline")}
            className="group cursor-pointer hover:border-accent transition-all duration-300 bg-card overflow-hidden"
          >
            <div className="h-1 w-full bg-accent" />
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Landline Leads</p>
                <h3 className="text-3xl font-code font-bold text-accent group-hover:scale-105 transition-transform">{stats.landline}</h3>
              </div>
              <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
            <div className="px-6 pb-4 flex justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 group-hover:text-accent transition-colors">
                <Download className="h-3 w-3" /> Auto Download XLSX
              </span>
            </div>
          </Card>

          <Card 
            onClick={() => downloadCategory("Invalid")}
            className="group cursor-pointer hover:border-destructive transition-all duration-300 bg-card overflow-hidden"
          >
            <div className="h-1 w-full bg-destructive" />
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Invalid Entries</p>
                <h3 className="text-3xl font-code font-bold text-destructive group-hover:scale-105 transition-transform">{stats.invalid}</h3>
              </div>
              <div className="p-3 rounded-full bg-destructive/10 group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </CardContent>
            <div className="px-6 pb-4 flex justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 group-hover:text-destructive transition-colors">
                <Download className="h-3 w-3" /> Auto Download XLSX
              </span>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium px-1">
            <span className="text-muted-foreground">{isProcessing ? "Processing Data Streams..." : "System Idle"}</span>
            <span className="text-primary font-code">{progress}%</span>
          </div>
          <Progress value={progress} className={`h-3 bg-muted ${isProcessing ? 'animate-pulse-violet' : ''}`} />
        </div>

        {/* Results Table */}
        <Card className="bg-card border-muted shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted">
            <div className="space-y-1">
              <CardTitle className="text-lg font-headline">Live Lead Feed</CardTitle>
              <CardDescription>Filtered list of valid business leads discovered</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-code py-1">Valid: {stats.mobile + stats.landline}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[550px] overflow-auto">
              <Table className="relative w-full border-collapse">
                <TableHeader className="sticky-header">
                  <TableRow className="hover:bg-transparent border-b border-muted">
                    <TableHead className="w-[150px] font-headline uppercase text-[10px] tracking-widest text-muted-foreground">Business Name</TableHead>
                    <TableHead className="font-headline uppercase text-[10px] tracking-widest text-muted-foreground">Phone Number</TableHead>
                    <TableHead className="font-headline uppercase text-[10px] tracking-widest text-muted-foreground">Type</TableHead>
                    <TableHead className="font-headline uppercase text-[10px] tracking-widest text-muted-foreground">Source Link</TableHead>
                    <TableHead className="text-right font-headline uppercase text-[10px] tracking-widest text-muted-foreground">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground text-sm">
                        No active leads found. Upload a file and press start to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id} className="border-b border-muted/30 group hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium truncate max-w-[150px]">{lead.businessName}</TableCell>
                        <TableCell className="font-code text-accent">{lead.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge 
                            className={`font-normal ${
                              lead.type === 'Mobile' ? 'bg-primary/20 text-primary border-primary/50' : 
                              lead.type === 'Landline' ? 'bg-accent/20 text-accent border-accent/50' : 
                              'bg-destructive/20 text-destructive border-destructive/50'
                            }`}
                          >
                            {lead.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-2 group/link">
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                            <a href={lead.sourceLink.startsWith('http') ? lead.sourceLink : '#'} target="_blank" rel="noreferrer" className="truncate text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                              {lead.sourceLink}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground font-code">
                          {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
