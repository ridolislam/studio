
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Zap,
  Loader2,
  Upload,
  RefreshCcw,
  Terminal,
  Activity,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Smartphone,
  Phone,
  Radio,
  Globe2,
  Layers,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { syncUserProfile, getUserHistory, getBatchInfo } from '@/app/actions/backend';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  status: 'success' | 'invalid' | 'fake' | 'failed' | 'error';
  timestamp: string;
  provider?: string;
  error?: string;
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState('');
  const [region, setRegion] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeServer, setActiveServer] = useState<1 | 2>(1);
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, voip: 0, toll_free: 0, invalid: 0, fake: 0, failed: 0 });
  const [showCreditModal, setShowCreditModal] = useState({ open: false, msg: '' });
  const [batchInfo, setBatchInfo] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const stopRequestedRef = useRef(false);
  const abortControllersRef = useRef<AbortController[]>([]);
  const runIdRef = useRef<string>('');

  useEffect(() => {
    // Immediate fetch on mount
    fetchBatchInfo();
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCredits(userData.credits || 0);
      } catch(e) {}
    }
    fetchHistory();
  }, []);

  const fetchBatchInfo = async () => {
    try {
      const res = await getBatchInfo();
      if (res.success) {
        setBatchInfo(res);
        setActiveServer(res.activeServer);
      }
    } catch (e) {}
  };

  const fetchAndSyncProfile = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const userData = JSON.parse(userStr);
      const email = userData.email || userData.data?.email || userData.user?.email;
      if (!email) return;
      setIsSyncing(true);
      const res = await syncUserProfile(email);
      if (res.success) {
        updateCreditsState(res.credits);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const updateCreditsState = (newCredits: number) => {
    setCredits(newCredits);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      localStorage.setItem('user', JSON.stringify({ ...userData, credits: newCredits }));
    }
    window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: newCredits } }));
  };

  const fetchHistory = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const userData = JSON.parse(userStr);
      const email = userData.email || userData.data?.email || userData.user?.email;
      if (!email) return;
      const res = await getUserHistory({ email });
      if (res.success) setHistory(res.history || []);
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const extracted = rows.map(r => String(r[0] || '').trim()).filter(n => n.length >= 3);
        if (extracted.length > 0) {
          setNumberInput(prev => (prev ? prev + '\n' : '') + extracted.join('\n'));
          toast({ title: "Imported", description: `${extracted.length} numbers added.` });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Invalid file format." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleStart = async () => {
    const allNumbers = Array.from(new Set(numberInput.split('\n').map(n => n.trim()).filter(n => n !== '')));
    if (allNumbers.length === 0) return;

    if (batchInfo?.keysAvailable === false) {
      toast({ variant: "destructive", title: "Action Required", description: "No API Key Left in System." });
      return;
    }

    if (credits < allNumbers.length) {
      setShowCreditModal({ open: true, msg: "Your Credit Not Available to process this list." });
      return;
    }

    setIsProcessing(true);
    stopRequestedRef.current = false;
    abortControllersRef.current = [];
    runIdRef.current = `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setProgress(0);
    setResults([]);
    setCounts({ mobile: 0, landline: 0, voip: 0, toll_free: 0, invalid: 0, fake: 0, failed: 0 });

    const userStr = localStorage.getItem('user');
    const userData = JSON.parse(userStr || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;

    if (!email) {
      setIsProcessing(false);
      return;
    }

    // Use pre-fetched batch info or defaults
    const batchSize = batchInfo?.batchSize || batchInfo?.recommendedBatchSize || 25;
    const concurrency = batchInfo?.concurrency || 3;
    const batches = [];
    for (let i = 0; i < allNumbers.length; i += batchSize) {
      batches.push(allNumbers.slice(i, i + batchSize));
    }

    // Refresh batch info in background for future
    fetchBatchInfo();

    let batchIdx = 0;
    let completedCount = 0;
    const total = allNumbers.length;

    // Sliding Window Concurrency Pool
    const runWorker = async () => {
      while (batchIdx < batches.length && !stopRequestedRef.current) {
        const currentBatchIdx = batchIdx++;
        const currentBatch = batches[currentBatchIdx];
        
        const success = await processBatch(email, currentBatch, runIdRef.current);
        if (!success) {
          stopRequestedRef.current = true;
          break;
        }

        completedCount += currentBatch.length;
        setProgress(Math.round((completedCount / total) * 100));
      }
    };

    // Parallel Execution
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, batches.length); i++) {
      workers.push(runWorker());
    }

    await Promise.all(workers);

    setIsProcessing(false);
    if (!stopRequestedRef.current) {
      toast({ title: "Done", description: "Validation cycle completed." });
    }
    
    fetchAndSyncProfile();
    fetchHistory();
  };

  const processBatch = async (email: string, numbers: string[], runId: string, retryCount = 0): Promise<boolean> => {
    if (stopRequestedRef.current) return false;

    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    
    try {
      const response = await fetch('https://numcheckr.onrender.com/api/user/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, numbers, region, runId }),
        signal: controller.signal
      });

      // Update credits from header
      const creditsLeft = response.headers.get('X-Credits-Left');
      if (creditsLeft) {
        const val = parseInt(creditsLeft);
        if (!isNaN(val)) updateCreditsState(val);
      }

      if (response.status === 402) {
        setShowCreditModal({ open: true, msg: "Your Credit Not Available" });
        return false;
      }

      const data = await response.json();

      if (data.status === 'NO_CREDITS') {
        setShowCreditModal({ open: true, msg: "Your Credit Not Available" });
        return false;
      }

      if (data.status === 'PAUSED') return true; // Stop current batch but don't fail entire run

      if (response.ok && (Array.isArray(data) || (data.results && Array.isArray(data.results)))) {
        updateUI(Array.isArray(data) ? data : data.results);
      } else {
        throw new Error(data.message || 'Server error');
      }

      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;

      if (retryCount < 1 && !stopRequestedRef.current) {
        return processBatch(email, numbers, runId, retryCount + 1);
      }

      // Mark batch as failed
      updateUI(numbers.map(n => ({
        number: n,
        valid: false,
        error: err.message || "Connection Failed",
        line_type: 'Error'
      })));

      if (err.message?.includes("No API Key") || err.message?.includes("Credit")) return false;

      return true; 
    } finally {
      abortControllersRef.current = abortControllersRef.current.filter(c => c !== controller);
    }
  };

  const updateUI = (newResults: any[]) => {
    const mapped = newResults.map(item => ({
      id: Math.random().toString(36).substring(7),
      number: item.number,
      type: item.line_type || (item.error ? 'Error' : 'Unknown'),
      carrier: item.carrier || '—',
      location: item.location || item.country_name || '—',
      status: item.error ? 'error' : (item.valid === false ? 'invalid' : (item.phonevalidator?.fake_number?.toLowerCase() === 'yes' ? 'fake' : 'success')),
      timestamp: new Date().toISOString(),
      provider: item.provider,
      error: item.error
    }));

    setResults(prev => [...mapped, ...prev].slice(0, 10000));

    mapped.forEach(item => {
      const type = (item.type || '').toLowerCase();
      setCounts(c => {
        const next = { ...c };
        if (item.status === 'error') next.failed += 1;
        else if (item.status === 'fake') next.fake += 1;
        else if (item.status === 'invalid') next.invalid += 1;
        else if (type.includes('mobile')) next.mobile += 1;
        else if (type.includes('landline')) next.landline += 1;
        else if (type.includes('voip')) next.voip += 1;
        else if (type.includes('toll')) next.toll_free += 1;
        else next.invalid += 1;
        return next;
      });
    });
  };

  const handleStop = async () => {
    stopRequestedRef.current = true;
    abortControllersRef.current.forEach(c => c.abort());
    abortControllersRef.current = [];

    const userStr = localStorage.getItem('user');
    const userData = JSON.parse(userStr || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    
    if (email && runIdRef.current) {
      try {
        await fetch('https://numcheckr.onrender.com/api/user/stop-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, runId: runIdRef.current })
        });
      } catch (e) {}
    }

    setIsProcessing(false);
    toast({ title: "Paused", description: "Validation stopped." });
  };

  const downloadResults = (filter?: string) => {
    let filtered = results;
    if (filter) {
      if (filter === 'mobile') filtered = results.filter(r => r.type.toLowerCase().includes('mobile'));
      else if (filter === 'landline') filtered = results.filter(r => r.type.toLowerCase().includes('landline'));
      else if (filter === 'voip') filtered = results.filter(r => r.type.toLowerCase().includes('voip'));
      else if (filter === 'toll_free') filtered = results.filter(r => r.type.toLowerCase().includes('toll'));
      else if (filter === 'fake') filtered = results.filter(r => r.status === 'fake');
      else if (filter === 'invalid') filtered = results.filter(r => r.status === 'invalid');
      else if (filter === 'failed') filtered = results.filter(r => r.status === 'error');
    }
    
    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "Empty", description: "No results to export." });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `numcheckr_results_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <TabsList className="bg-card/60 p-1 rounded-2xl h-14 border border-white/5">
              <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs h-full px-8">Validator</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black italic uppercase text-xs h-full px-8">Logs</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap items-center gap-3 px-2 mt-1">
               <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", activeServer === 2 ? "bg-accent" : "bg-primary animate-pulse")} />
                  <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    {activeServer === 2 ? "Core 2 Distributed" : "Core 1 Standard"}
                  </span>
               </div>
               {batchInfo && (
                 <>
                   <div className="h-3 w-px bg-white/10" />
                   <div className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-primary opacity-50" />
                      <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">
                        Batch: {batchInfo.batchSize || batchInfo.recommendedBatchSize || 25}
                      </span>
                   </div>
                   <div className="h-3 w-px bg-white/10" />
                   <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-accent opacity-50" />
                      <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">
                        Unit Cycle: {batchInfo.concurrency || 3}
                      </span>
                   </div>
                 </>
               )}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/20 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Balance</span>
              <span className="text-2xl font-black italic tabular-nums">{credits}</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" onClick={fetchAndSyncProfile} disabled={isSyncing} className="rounded-xl hover:bg-primary/10">
              <RefreshCcw className={cn("h-5 w-5 text-primary", isSyncing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <TabsContent value="tool" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className="xl:col-span-1 border-white/10 bg-card shadow-2xl overflow-hidden rounded-[2rem]">
              <div className={cn("h-1.5 w-full", activeServer === 2 ? "bg-accent" : "bg-primary")} />
              <CardHeader className="flex flex-row items-center justify-between pt-6">
                <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 opacity-70 tracking-[0.2em]">
                  <Terminal className="h-3 w-3" /> Input Console
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-[9px] font-black uppercase bg-white/5 rounded-lg border border-white/5">Import</Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-8">
                <div className="relative group">
                  <Textarea 
                    placeholder="Paste numbers (e.g. +1415...)" 
                    value={numberInput} 
                    onChange={e => setNumberInput(e.target.value)} 
                    className="min-h-[380px] font-code text-xs bg-black/40 border-white/5 rounded-2xl resize-none placeholder:opacity-20 shadow-inner focus:border-primary/50 transition-all" 
                    disabled={isProcessing} 
                  />
                  <div className="absolute bottom-4 right-4 text-[9px] font-black opacity-20 uppercase">
                    Lines: {numberInput.split('\n').filter(l => l.trim()).length}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black uppercase opacity-50 tracking-widest">Routing Region</label>
                  </div>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="bg-black/40 border-white/5 h-12 rounded-xl text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl bg-card border-white/10">
                      <SelectItem value="1" className="font-bold text-xs">US & European Nodes</SelectItem>
                      <SelectItem value="2" className="font-bold text-xs">Global Optimization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button 
                    onClick={handleStart} 
                    disabled={isProcessing || !numberInput.trim()} 
                    className="h-16 bg-primary text-white font-black italic rounded-2xl text-xl shadow-lg shadow-primary/20 active:translate-y-1 transition-all"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <><Play className="mr-2 h-5 w-5 fill-current" /> START</>}
                  </Button>
                  <Button 
                    onClick={handleStop} 
                    disabled={!isProcessing} 
                    variant="destructive" 
                    className="h-16 font-black italic rounded-2xl text-xl shadow-lg shadow-destructive/10 active:translate-y-1 transition-all"
                  >
                    <Square className="mr-2 h-5 w-5 fill-current" /> STOP
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {[
                  { label: 'Mobile', count: counts.mobile, color: 'primary', icon: Smartphone, id: 'mobile' },
                  { label: 'Landline', count: counts.landline, color: 'blue-500', icon: Phone, id: 'landline' },
                  { label: 'VOIP', count: counts.voip, color: 'purple-500', icon: Radio, id: 'voip' },
                  { label: 'Toll Free', count: counts.toll_free, color: 'cyan-400', icon: Globe2, id: 'toll_free' },
                  { label: 'Fake', count: counts.fake, color: 'amber-500', icon: ShieldAlert, id: 'fake' },
                  { label: 'Invalid', count: counts.invalid, color: 'red-500', icon: AlertCircle, id: 'invalid' },
                  { label: 'Error', count: counts.failed, color: 'slate-500', icon: Terminal, id: 'failed' }
                ].map(item => (
                  <Card 
                    key={item.id} 
                    onClick={() => downloadResults(item.id)} 
                    className={cn(
                      "p-4 rounded-[1.5rem] border-white/5 transition-all cursor-pointer hover:scale-105 active:scale-95 group shadow-xl bg-card/40 backdrop-blur-sm overflow-hidden relative",
                    )}
                  >
                    <div className={cn("absolute top-0 left-0 w-full h-1 opacity-40", `bg-${item.color}`)} />
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-50 group-hover:text-primary transition-colors">{item.label}</p>
                      <item.icon className="h-3 w-3 opacity-20" />
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tighter tabular-nums">{item.count}</h3>
                  </Card>
                ))}
              </div>

              <Card className="bg-card/40 p-6 rounded-[2rem] border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-primary/5 pointer-events-none" />
                <div className="flex justify-between items-end mb-4 relative">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 rounded-lg">
                       <Activity className={cn("h-4 w-4 text-primary", isProcessing && "animate-pulse")} />
                     </div>
                     <div>
                       <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em]">Processing Pipeline</span>
                       <p className="text-xs font-bold text-muted-foreground mt-0.5">Instant parallel cycle active</p>
                     </div>
                   </div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black italic text-primary tabular-nums">{progress}%</span>
                     <span className="text-[10px] font-black uppercase opacity-30">Complete</span>
                   </div>
                </div>
                <Progress value={progress} className="h-4 bg-black/40 rounded-full" />
              </Card>

              <Card className="bg-card/60 rounded-[2.5rem] overflow-hidden border-white/5 shadow-3xl backdrop-blur-2xl">
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]", isProcessing ? "bg-green-500 animate-pulse" : "bg-muted")} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Intelligence Feed</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-xl text-[9px] font-black uppercase px-6 border-white/10 hover:bg-primary/10 transition-colors" onClick={() => downloadResults('mobile')}>Mobiles Only</Button>
                    <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-xl text-[9px] font-black uppercase px-6 bg-primary text-white border-none shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" onClick={() => downloadResults()}>Export Result</Button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-xl">
                      <TableRow className="border-white/5 h-16">
                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest">Number Identity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Geo/Location</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                        <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-widest">Engine</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-96 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-10 grayscale">
                              <Zap className="h-24 w-24" />
                              <p className="font-black italic uppercase text-2xl tracking-tighter">System Ready for Injection</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        results.map(res => (
                          <TableRow key={res.id} className="h-20 border-white/5 hover:bg-white/5 transition-all group relative">
                            <TableCell className="px-10">
                              <span className="font-code font-black text-primary text-sm tracking-tight group-hover:scale-105 transition-transform origin-left">{res.number}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                res.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                                res.status === 'fake' ? 'bg-amber-500/10 text-amber-500' : 
                                res.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-red-500/10 text-red-500',
                                "border-none text-[8px] font-black px-4 py-1 uppercase tracking-widest rounded-lg"
                              )}>
                                {res.status === 'error' ? 'FAILED' : res.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[11px] font-black italic opacity-80">{res.location}</TableCell>
                            <TableCell className="text-[11px] font-bold italic opacity-40">{res.carrier}</TableCell>
                            <TableCell className="text-right px-10">
                               <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase px-3">{res.provider === 'phonevalidator' ? 'CORE 2' : 'CORE 1'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <Card className="border-white/5 bg-card/60 rounded-[3rem] overflow-hidden p-8 shadow-3xl backdrop-blur-2xl">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-2xl"><Activity className="h-6 w-6 text-primary" /></div>
                 <div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">System Event Stream</h3>
                 </div>
               </div>
               <Button variant="outline" size="sm" onClick={fetchHistory} className="h-12 font-black uppercase text-[10px] border-white/10 px-8 rounded-xl hover:bg-primary/10 transition-all">Sync Records</Button>
             </div>
             <Table>
               <TableHeader className="bg-muted/10">
                 <TableRow className="border-white/5 h-16">
                   <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest">Event Timeline</TableHead>
                   <TableHead className="text-[10px] font-black uppercase tracking-widest">Transaction Signature</TableHead>
                   <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-widest">Unit Impact</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {history.length === 0 ? (
                   <TableRow><TableCell colSpan={3} className="h-80 text-center opacity-10 font-black italic uppercase text-3xl tracking-tighter">No Events Streamed</TableCell></TableRow>
                 ) : (
                   history.map((item, i) => (
                     <TableRow key={i} className="border-white/5 h-20 hover:bg-white/5 transition-colors">
                       <TableCell className="px-10 text-xs font-code opacity-40">{new Date(item.date).toLocaleString()}</TableCell>
                       <TableCell className="font-black italic text-sm tracking-tight">{item.description}</TableCell>
                       <TableCell className={cn(
                         "text-right px-10 font-black italic text-2xl tracking-tighter",
                         item.type === 'Payment' ? 'text-green-500' : 'text-primary'
                       )}>
                         {item.type === 'Payment' ? '+' : '-'}{item.amount}
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreditModal.open} onOpenChange={(o) => setShowCreditModal(s => ({...s, open: o}))}>
        <DialogContent className="border-primary/20 bg-card rounded-[2.5rem] max-w-sm text-center shadow-3xl p-10">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-destructive/20 shadow-lg shadow-destructive/10">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-3 leading-none">Security Halt</DialogTitle>
          <p className="font-bold uppercase text-[10px] tracking-widest opacity-60 mb-8 px-4 leading-relaxed">
            {showCreditModal.msg}
          </p>
          <div className="space-y-4">
            <Button onClick={() => window.location.href = '/credits'} className="w-full h-20 bg-primary text-white font-black italic rounded-2xl text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Zap className="mr-3 h-6 w-6 fill-current" /> RECHARGE WALLET
            </Button>
            <Button variant="ghost" onClick={() => setShowCreditModal({open: false, msg: ''})} className="w-full h-12 font-black uppercase text-[10px] opacity-50 tracking-widest">Close Alert</Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,85,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(113,85,255,0.4); }
      `}</style>
    </div>
  );
}
