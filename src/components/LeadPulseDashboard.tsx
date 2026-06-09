
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  CheckCircle2, 
  Search,
  Zap,
  Loader2,
  Trash2,
  Download,
  Upload,
  Smartphone,
  Phone,
  AlertCircle,
  Link as LinkIcon,
  History as HistoryIcon,
  Calendar,
  ArrowRight
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { validateNumber, getUserHistory, syncUserProfile } from "@/app/actions/backend";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  status: "success" | "invalid";
  timestamp: string;
}

interface HistoryItem {
  _id?: string;
  date: string;
  type: 'Work' | 'Payment';
  description: string;
  amount: string;
  impact?: string;
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Initial load and profile sync
  useEffect(() => {
    const loadAndSync = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push("/login");
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const formattedUser = user.data || user.user || user;
        
        if (formattedUser && formattedUser.email) {
          // Set local state immediately
          setCredits(Number(formattedUser.credits) || 0);
          
          // Try to sync with server to get absolute latest
          const res = await syncUserProfile(formattedUser.email);
          if (res && res.success) {
            setCredits(Number(res.credits));
            const updatedUser = { ...formattedUser, credits: res.credits };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          fetchHistory();
        }
      } catch (e) {
        console.error("Dashboard init error:", e);
      }
    };

    loadAndSync();
  }, [router]);

  // Keep internal state updated from localStorage changes (for parent syncs)
  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const formattedUser = user.data || user.user || user;
          if (formattedUser) {
            setCredits(Number(formattedUser.credits) || 0);
          }
        } catch (e) {}
      }
    };

    const interval = setInterval(handleStorageChange, 2000); // Check every 2s for local changes
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      const formattedUser = user.data || user.user || user;
      if (!formattedUser || !formattedUser.email) return;

      setIsLoadingHistory(true);
      const result = await getUserHistory({ email: formattedUser.email });
      if (result.success) {
        setHistory(result.history || []);
        setFilteredHistory(result.history || []);
      }
      setIsLoadingHistory(false);
    } catch (e) {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    const filtered = history.filter(item => 
      item.description.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.type.toLowerCase().includes(historySearch.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [historySearch, history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    setIsExtracting(true);
    toast({ title: "Scanning File", description: "Extracting leads from file..." });

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;

        let rows: any[][] = [];

        if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
        } else {
          const text = data.toString();
          rows = text.split('\n').map(line => line.split(','));
        }

        const extractedNumbers: string[] = [];
        let extractedLinksCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 1) continue;

          let foundNumber = "";
          let sourceLink = String(row[0] || "").trim();

          row.forEach((cell) => {
            const cellVal = String(cell || "").trim();
            const cleanCell = cellVal.replace(/[\s-()]/g, '');
            if (!foundNumber && /^\+?[0-9]{7,15}$/.test(cleanCell)) {
              foundNumber = cleanCell;
            }
          });

          if (foundNumber) {
            extractedNumbers.push(foundNumber);
            if (sourceLink.startsWith('http')) {
              extractedLinksCount++;
            }
          }
        }

        if (extractedNumbers.length > 0) {
          const numbersStr = extractedNumbers.join('\n');
          setNumberInput(prev => prev ? prev + '\n' + numbersStr : numbersStr);
          setCounts(prev => ({ 
            ...prev, 
            links: prev.links + extractedLinksCount 
          }));
          toast({ title: "Success", description: `Extracted ${extractedNumbers.length} phone numbers.` });
        } else {
          toast({ variant: "destructive", title: "No Data", description: "No valid numbers found." });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Scan Failed", description: "Invalid file format." });
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
      toast({ variant: "destructive", title: "Input Empty", description: "Please enter numbers to validate." });
      return;
    }

    // Double check credits from localStorage before starting to avoid stale state issues
    let currentCredits = credits;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const formattedUser = user.data || user.user || user;
        currentCredits = Number(formattedUser.credits) || 0;
        setCredits(currentCredits); // Sync local state
      } catch(e) {}
    }

    if (currentCredits <= 0) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Credits", 
        description: `You have 0 credits. Please top up to validate numbers.` 
      });
      return;
    }

    // Determine how many numbers we can process based on credits
    const processLimit = Math.min(lines.length, currentCredits);
    
    if (processLimit < lines.length) {
      toast({
        title: "Partial Processing",
        description: `You have ${currentCredits} credits. Validating the first ${processLimit} numbers.`
      });
    }

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);

    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      const formattedUser = user.data || user.user || user;
      if (!formattedUser) return;

      for (let i = 0; i < processLimit; i++) {
        if (!processingRef.current) break;

        try {
          const result = await validateNumber({ 
            email: formattedUser.email,
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

            if (!data.valid) {
              setCounts(prev => ({ ...prev, invalid: prev.invalid + 1 }));
            } else if (type.includes("mobile")) {
              setCounts(prev => ({ ...prev, mobile: prev.mobile + 1 }));
            } else {
              setCounts(prev => ({ ...prev, landline: prev.landline + 1 }));
            }
            
            if (result.remainingCredits !== undefined) {
              const newRemCredits = Number(result.remainingCredits);
              setCredits(newRemCredits);
              const updatedUser = { ...formattedUser, credits: newRemCredits };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              const creditDisplay = document.getElementById('creditBalance');
              if (creditDisplay) creditDisplay.innerText = newRemCredits.toString();
              
              // If we ran out of credits during processing (unlikely but safe)
              if (newRemCredits <= 0) {
                toast({ variant: "destructive", title: "Credits Exhausted", description: "Stopping process as credits are finished." });
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error validating ${lines[i]}`, error);
        }

        setProgress(Math.round(((i + 1) / processLimit) * 100));
      }
    } catch (e) {}

    setIsProcessing(false);
    processingRef.current = false;
    fetchHistory();
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

    if (filtered.length === 0) return;

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
    <div className="space-y-8">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
           <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-card/60 border border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" /> Validation Tool
            </TabsTrigger>
            <TabsTrigger value="history" onClick={fetchHistory} className="rounded-xl font-black italic uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              <HistoryIcon className="h-4 w-4 mr-2" /> Activity History
            </TabsTrigger>
          </TabsList>

          <Card className="bg-primary/5 border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black uppercase text-primary/70 leading-none mb-1">Live Balance</p>
              <h2 className="text-2xl font-black italic leading-none">{credits}</h2>
            </div>
            <div className="h-8 w-px bg-primary/20" />
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </Card>
        </div>

        <TabsContent value="tool" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
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
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-dashed border-primary/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Leads
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv,.txt" />

                  <Textarea 
                    placeholder="Paste numbers here..."
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
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => downloadCategory('mobile')} className="group">
                  <Card className="border-green-500/20 bg-green-500/5 p-4 rounded-2xl flex items-center justify-between hover:bg-green-500/10 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-green-500">Mobile</p>
                      <h3 className="text-3xl font-black italic">{counts.mobile}</h3>
                    </div>
                    <Smartphone className="h-8 w-8 text-green-500 opacity-20" />
                  </Card>
                </button>
                
                <button onClick={() => downloadCategory('landline')} className="group">
                  <Card className="border-blue-500/20 bg-blue-500/5 p-4 rounded-2xl flex items-center justify-between hover:bg-blue-500/10 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-500">Landline</p>
                      <h3 className="text-3xl font-black italic">{counts.landline}</h3>
                    </div>
                    <Phone className="h-8 w-8 text-blue-500 opacity-20" />
                  </Card>
                </button>

                <button onClick={() => downloadCategory('invalid')} className="group">
                  <Card className="border-red-500/20 bg-red-500/5 p-4 rounded-2xl flex items-center justify-between hover:bg-red-500/10 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-red-500">Invalid</p>
                      <h3 className="text-3xl font-black italic">{counts.invalid}</h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
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

              <div className="bg-card/40 p-5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>{isProcessing ? "Validating Engine..." : "Idle"}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-muted/30" />
              </div>

              <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-white/5 bg-muted/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Validation Table
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => downloadCategory('all')} disabled={results.length === 0}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setResults([]); setCounts({mobile:0,landline:0,invalid:0,links:0}); setProgress(0); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-10">
                        <TableRow className="border-white/5">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Number</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-64 text-center opacity-20">
                              <Search className="h-12 w-12 mx-auto mb-4" />
                              <p className="font-black italic uppercase tracking-widest">No active leads</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          results.map((res) => (
                            <TableRow key={res.id} className="border-white/5 hover:bg-primary/5 transition-colors">
                              <TableCell className="font-code font-bold text-primary">{res.number}</TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  res.status === 'invalid' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500',
                                  "border-none text-[9px] font-black uppercase"
                                )}>
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
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/5">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Activity History</CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Track your work and payments</p>
              </div>

              <div className="relative w-full md:w-[350px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by number or type..." 
                  className="pl-12 h-12 bg-black/20 border-white/10 rounded-xl font-bold"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Date & Time</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Transaction Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Amount / Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                          <p className="font-black italic uppercase text-xs">Syncing with server...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="font-black italic uppercase text-muted-foreground/40">No records found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((item, idx) => (
                        <TableRow key={item._id || idx} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell className="py-6">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-bold font-code">{new Date(item.date).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "border-none text-[9px] font-black uppercase px-3 py-1",
                              item.type === 'Payment' 
                                ? "bg-green-500/10 text-green-500" 
                                : "bg-blue-500/10 text-blue-500"
                            )}>
                              {item.type === 'Payment' ? 'SUCCESS' : 'VALIDATED'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                item.type === 'Payment' ? "bg-green-500" : "bg-blue-500"
                              )} />
                              <span className="text-sm font-bold italic truncate max-w-[200px] md:max-w-none">{item.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                               <span className={cn(
                                 "text-lg font-black italic",
                                 item.type === 'Payment' ? "text-green-500" : "text-primary"
                               )}>
                                 {item.amount}
                               </span>
                               <ArrowRight className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

