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
  Cpu,
  History as HistoryIcon,
  Download,
  Eye,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { syncUserProfile, getUserHistory, getBatchInfo, stopValidation, getBatchDetails, downloadBatchData } from '@/app/actions/backend';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface BatchRecord {
  id: string;
  source: "dashboard" | "api";
  runId: string;
  batchNo: number | null;
  sentAt: string;
  total: number;
  processed: number;
  valid: number;
  invalid: number;
  failed: number;
  expiresAt: string;
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState('');
  const [region, setRegion] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [history, setHistory] = useState<BatchRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeServer, setActiveServer] = useState<1 | 2>(1);
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, voip: 0, toll_free: 0, invalid: 0, fake: 0, failed: 0 });
  const [showCreditModal, setShowCreditModal] = useState({ open: false, msg: '' });
  const [batchInfo, setBatchInfo] = useState<any>(null);

  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [isLoadingBatchDetails, setIsLoadingBatchDetails] = useState(false);
  const [batchFilter, setBatchFilter] = useState('all');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const stopRequestedRef = useRef(false);
  const abortControllersRef = useRef<AbortController[]>([]);
  const runIdRef = useRef<string>('');

  useEffect(() => {
    fetchBatchInfo();
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCredits(userData.credits || 0);
        const email = userData.email || userData.data?.email || userData.user?.email;
        if (email) fetchHistory(email);
      } catch(e) {}
    }
  }, []);

  const fetchBatchInfo = async () => {
    try {
      const res = await getBatchInfo();
      if (res.success) {
        setBatchInfo(res);
        setActiveServer(res.activeServer || 1);
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

  const fetchHistory = async (email: string) => {
    if (!email) return;
    setIsLoadingHistory(true);
    try {
      const res = await getUserHistory({ email, limit: 100 });
      if (res.success) setHistory(res.history || []);
    } catch (e) {
      console.error("History fetch error");
    } finally {
      setIsLoadingHistory(false);
    }
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

    const batchSize = batchInfo?.batchSize || batchInfo?.recommendedBatchSize || 25;
    const concurrency = batchInfo?.concurrency || 3;
    
    const batches = [];
    for (let i = 0; i < allNumbers.length; i += batchSize) {
      batches.push(allNumbers.slice(i, i + batchSize));
    }

    fetchBatchInfo();

    let batchIdx = 0;
    let completedCount = 0;
    const total = allNumbers.length;

    const runWorker = async () => {
      while (batchIdx < batches.length && !stopRequestedRef.current) {
        const currentBatchIdx = batchIdx++;
        const currentBatch = batches[currentBatchIdx];
        
        const success = await processBatch(email, currentBatch, runIdRef.current, currentBatchIdx + 1);
        if (!success) {
          stopRequestedRef.current = true;
          break;
        }

        completedCount += currentBatch.length;
        setProgress(Math.round((completedCount / total) * 100));
      }
    };

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
    fetchHistory(email);
  };

  const processBatch = async (email: string, numbers: string[], runId: string, batchNo: number, retryCount = 0): Promise<boolean> => {
    if (stopRequestedRef.current) return false;

    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    
    try {
      const response = await fetch('https://numcheckr.onrender.com/api/user/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, numbers, region, runId, batchNo }),
        signal: controller.signal
      });

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

      if (data.status === 'PAUSED') return true;

      if (response.ok && (Array.isArray(data) || (data.results && Array.isArray(data.results)))) {
        const resultsArray = Array.isArray(data) ? data : data.results;
        updateUI(resultsArray);
      } else {
        throw new Error(data.message || 'Server error');
      }

      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;

      if (retryCount < 1 && !stopRequestedRef.current) {
        return processBatch(email, numbers, runId, batchNo, retryCount + 1);
      }

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
        await stopValidation(email, runIdRef.current);
      } catch (e) {}
    }

    setIsProcessing(false);
    toast({ title: "Paused", description: "Validation stopped." });
  };

  const openBatchDetails = async (batch: BatchRecord) => {
    setSelectedBatch(batch);
    setBatchFilter('all');
    fetchBatchDetails(batch.id, 'all');
  };

  const fetchBatchDetails = async (batchId: string, filter: string) => {
    const userStr = localStorage.getItem('user');
    const userData = JSON.parse(userStr || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    if (!email) return;

    setIsLoadingBatchDetails(true);
    try {
      const res = await getBatchDetails({ email, batchId, filter });
      if (res.success) {
        setBatchDetails(res.results || []);
      } else if (res.message?.includes("expired")) {
        toast({ variant: "destructive", title: "Expired", description: "This batch data has expired (7+ days old)." });
        fetchHistory(email);
        setSelectedBatch(null);
      }
    } finally {
      setIsLoadingBatchDetails(false);
    }
  };

  const handleDownloadHistory = async (batchId: string, format: 'csv' | 'txt', filter: string = 'all') => {
    const userStr = localStorage.getItem('user');
    const userData = JSON.parse(userStr || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    if (!email) return;

    setIsDownloading(batchId + format);
    try {
      const res = await downloadBatchData({ email, batchId, format, filter });
      if (res.success && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: "Download Started", description: `File: ${res.filename}` });
      } else {
        toast({ variant: "destructive", title: "Error", description: res.message || "Download failed" });
      }
    } finally {
      setIsDownloading(null);
    }
  };

  const formatExpiresAt = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 24) {
      return `Expires in ${Math.floor(diffHours / 24)} days`;
    }
    return `Expires in ${diffHours} hours`;
  };

  const statsConfig = [
    { label: 'Mobile', count: counts.mobile, color: 'primary', icon: Smartphone, id: 'mobile', borderColor: 'border-primary/20', textColor: 'text-primary', iconColor: 'text-primary', bgGradient: 'from-primary/10 to-primary/5' },
    { label: 'Landline', count: counts.landline, color: 'blue-500', icon: Phone, id: 'landline', borderColor: 'border-blue-500/20', textColor: 'text-blue-500', iconColor: 'text-blue-500', bgGradient: 'from-blue-500/10 to-blue-500/5' },
    { label: 'VOIP', count: counts.voip, color: 'indigo-500', icon: Radio, id: 'voip', borderColor: 'border-indigo-500/20', textColor: 'text-indigo-500', iconColor: 'text-indigo-500', bgGradient: 'from-indigo-500/10 to-indigo-500/5' },
    { label: 'Toll Free', count: counts.toll_free, color: 'cyan-400', icon: Globe2, id: 'toll_free', borderColor: 'border-cyan-400/20', textColor: 'text-cyan-400', iconColor: 'text-cyan-400', bgGradient: 'from-cyan-400/10 to-cyan-400/5' },
    { label: 'Fake', count: counts.fake, color: 'amber-500', icon: ShieldAlert, id: 'fake', borderColor: 'border-amber-500/20', textColor: 'text-amber-500', iconColor: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
    { label: 'Invalid', count: counts.invalid, color: 'rose-500', icon: AlertCircle, id: 'invalid', borderColor: 'border-rose-500/20', textColor: 'text-rose-500', iconColor: 'text-rose-500', bgGradient: 'from-rose-500/10 to-rose-500/5' },
    { label: 'Error', count: counts.failed, color: 'slate-400', icon: Terminal, id: 'failed', borderColor: 'border-slate-400/20', textColor: 'text-slate-400', iconColor: 'text-slate-400', bgGradient: 'from-slate-400/10 to-slate-400/5' }
  ];

  const displayBatchSize = batchInfo?.batchSize || batchInfo?.recommendedBatchSize || 25;
  const displayConcurrency = batchInfo?.concurrency || 3;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <TabsList className="bg-card/60 p-1 rounded-2xl h-14 border border-white/5">
              <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs h-full px-8">Validator</TabsTrigger>
              <TabsTrigger 
                value="history" 
                onClick={() => {
                   const userStr = localStorage.getItem('user');
                   if (userStr) {
                     const userData = JSON.parse(userStr);
                     const email = userData.email || userData.data?.email || userData.user?.email;
                     if (email) fetchHistory(email);
                   }
                }}
                className="rounded-xl font-black italic uppercase text-xs h-full px-8"
              >
                History
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap items-center gap-3 px-2 mt-1">
               <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", activeServer === 2 ? "bg-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-primary animate-pulse shadow-[0_0_8px_rgba(113,85,255,0.6)]")} />
                  <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    {activeServer === 2 ? "Core 2 Distributed" : "Core 1 Standard"}
                  </span>
               </div>
               <div className="h-4 w-px bg-white/10 mx-1" />
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Batch Size:</span>
                  <Badge variant="outline" className="text-[9px] font-black border-white/10 h-5 px-2 bg-white/5">{displayBatchSize}</Badge>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Unit Cycle:</span>
                  <Badge variant="outline" className="text-[9px] font-black border-white/10 h-5 px-2 bg-white/5">{displayConcurrency}</Badge>
               </div>
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
              <div className={cn("h-1.5 w-full", activeServer === 2 ? "bg-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(113,85,255,0.5)]")} />
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
                {statsConfig.map(item => (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "p-5 rounded-[2rem] border-2 transition-all group shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden relative",
                      item.borderColor,
                      "bg-gradient-to-br",
                      item.bgGradient
                    )}
                  >
                    <div className={cn("absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity", item.iconColor)}>
                      <item.icon className="h-16 w-16" />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                        <item.icon className={cn("h-3 w-3", item.iconColor)} />
                        {item.label}
                      </p>
                      <h3 className={cn("text-4xl font-black italic tracking-tighter tabular-nums text-3d", item.textColor)}>
                        {item.count}
                      </h3>
                    </div>
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
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-2xl"><HistoryIcon className="h-6 w-6 text-primary" /></div>
                 <div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Validation History</h3>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5">
                     <Clock className="h-3 w-3" /> Records are kept for 7 days
                   </p>
                 </div>
               </div>
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                   const userStr = localStorage.getItem('user');
                   if (userStr) {
                     const userData = JSON.parse(userStr);
                     const email = userData.email || userData.data?.email || userData.user?.email;
                     if (email) fetchHistory(email);
                   }
                }} 
                disabled={isLoadingHistory}
                className="h-12 font-black uppercase text-[10px] border-white/10 px-8 rounded-xl hover:bg-primary/10 transition-all"
               >
                 {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />} Sync Logs
               </Button>
             </div>

             {history.length === 0 && !isLoadingHistory ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-6 opacity-20">
                  <HistoryIcon className="h-20 w-20" />
                  <p className="font-black italic uppercase text-xl text-center max-w-sm">No history yet. Your validated batches from the last 7 days will appear here.</p>
                </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {history.map((batch) => (
                   <Card 
                    key={batch.id} 
                    className="group bg-black/40 border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all shadow-xl relative overflow-hidden flex flex-col"
                   >
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        {batch.source === 'api' ? <Globe2 className="h-12 w-12" /> : <Smartphone className="h-12 w-12" />}
                     </div>
                     
                     <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-primary tracking-widest">
                            {batch.source === 'api' ? 'API Request' : `Batch #${batch.batchNo || 'N/A'}`}
                          </p>
                          <h4 className="text-lg font-black italic">{new Date(batch.sentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</h4>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase px-2">
                          {batch.total} Numbers
                        </Badge>
                     </div>

                     <div className="grid grid-cols-3 gap-2 mb-8">
                        <div className="bg-green-500/5 p-3 rounded-2xl border border-green-500/10 text-center">
                           <p className="text-[7px] font-black uppercase text-green-500 opacity-60 mb-1">Valid</p>
                           <p className="text-lg font-black italic text-green-500">{batch.valid}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                           <p className="text-[7px] font-black uppercase opacity-60 mb-1">Invalid</p>
                           <p className="text-lg font-black italic">{batch.invalid}</p>
                        </div>
                        {batch.failed > 0 && (
                          <div className="bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 text-center">
                            <p className="text-[7px] font-black uppercase text-amber-500 opacity-60 mb-1">Failed</p>
                            <p className="text-lg font-black italic text-amber-500">{batch.failed}</p>
                          </div>
                        )}
                     </div>

                     <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 flex items-center gap-1.5">
                           <Clock className="h-3 w-3" /> {formatExpiresAt(batch.expiresAt)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleDownloadHistory(batch.id, 'csv')} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openBatchDetails(batch)} className="h-8 w-8 rounded-lg text-white hover:bg-white/10">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                     </div>
                   </Card>
                 ))}
               </div>
             )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedBatch} onOpenChange={(o) => !o && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl border-white/10 bg-card rounded-[2.5rem] p-0 overflow-hidden">
           <DialogHeader className="p-8 border-b border-white/5 bg-white/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                   <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                     {selectedBatch?.source === 'api' ? 'API Engine Log' : `Batch #${selectedBatch?.batchNo} Analysis`}
                   </DialogTitle>
                   <DialogDescription className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">
                     Execution ID: {selectedBatch?.runId}
                   </DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase text-primary opacity-60">Success Rate</span>
                      <span className="text-xl font-black italic text-green-500">
                        {selectedBatch ? Math.round((selectedBatch.valid / selectedBatch.total) * 100) : 0}%
                      </span>
                   </div>
                   <div className="h-8 w-px bg-white/10 mx-2" />
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase opacity-60">Process Time</span>
                      <span className="text-xl font-black italic">{new Date(selectedBatch?.sentAt || '').toLocaleTimeString([], { timeStyle: 'short' })}</span>
                   </div>
                </div>
              </div>
           </DialogHeader>

           <div className="p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <Tabs value={batchFilter} onValueChange={(val) => { setBatchFilter(val); if(selectedBatch) fetchBatchDetails(selectedBatch.id, val); }} className="w-full sm:w-auto">
                    <TabsList className="bg-black/40 border border-white/5 h-12 rounded-xl p-1">
                       <TabsTrigger value="all" className="rounded-lg text-[9px] font-black uppercase px-6">All</TabsTrigger>
                       <TabsTrigger value="valid" className="rounded-lg text-[9px] font-black uppercase px-6 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">Valid</TabsTrigger>
                       <TabsTrigger value="invalid" className="rounded-lg text-[9px] font-black uppercase px-6 data-[state=active]:bg-white/10">Invalid</TabsTrigger>
                       <TabsTrigger value="failed" className="rounded-lg text-[9px] font-black uppercase px-6 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">Failed</TabsTrigger>
                    </TabsList>
                 </Tabs>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => selectedBatch && handleDownloadHistory(selectedBatch.id, 'txt', batchFilter)} 
                      disabled={!!isDownloading}
                      className="flex-1 sm:flex-none h-12 rounded-xl border-white/10 text-[9px] font-black uppercase px-6"
                    >
                       TXT
                    </Button>
                    <Button 
                      onClick={() => selectedBatch && handleDownloadHistory(selectedBatch.id, 'csv', batchFilter)} 
                      disabled={!!isDownloading}
                      className="flex-1 sm:flex-none h-12 rounded-xl bg-primary text-white text-[9px] font-black uppercase px-6 shadow-lg shadow-primary/20"
                    >
                       {isDownloading === (selectedBatch?.id + 'csv') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-2" />} Download CSV
                    </Button>
                 </div>
              </div>

              <ScrollArea className="h-[450px] rounded-3xl border border-white/5 bg-black/40">
                 {isLoadingBatchDetails ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                       <Loader2 className="h-8 w-8 animate-spin text-primary" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Streaming results...</p>
                    </div>
                 ) : (
                    <Table>
                      <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="border-white/5 h-14">
                          <TableHead className="px-8 text-[9px] font-black uppercase tracking-widest">Identity</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">Type</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">Carrier / Provider</TableHead>
                          <TableHead className="text-right px-8 text-[9px] font-black uppercase tracking-widest">Geo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchDetails.length === 0 ? (
                           <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20 font-black italic uppercase">No data found</TableCell></TableRow>
                        ) : (
                          batchDetails.map((item, idx) => (
                            <TableRow key={idx} className="border-white/5 h-16 hover:bg-white/5">
                              <TableCell className="px-8 font-code text-[11px] font-black text-primary">{item.number}</TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  item.error ? 'bg-amber-500/10 text-amber-500' : (item.valid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'),
                                  "border-none text-[8px] font-black uppercase px-3 py-1 rounded-md"
                                )}>
                                  {item.error ? 'FAILED' : (item.valid ? 'VALID' : 'INVALID')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[10px] font-bold uppercase opacity-60">{item.line_type || '-'}</TableCell>
                              <TableCell className="text-[10px] font-medium italic opacity-40">{item.carrier || '-'}</TableCell>
                              <TableCell className="text-right px-8 text-[10px] font-black italic opacity-60">{item.country_name || item.location || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                 )}
              </ScrollArea>
           </div>
           
           <DialogFooter className="p-8 border-t border-white/5 bg-white/5 flex justify-center items-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40 italic">
                 Security Layer: numcheckr distributed validation protocol v4.0
              </p>
           </DialogFooter>
        </DialogContent>
      </Dialog>

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
