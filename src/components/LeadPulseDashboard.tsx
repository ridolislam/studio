
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Zap,
  Loader2,
  Download,
  Upload,
  History as HistoryIcon,
  RefreshCcw,
  Terminal,
  Code2,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Info,
  ShieldAlert,
  HelpCircle,
  Copy,
  FileText,
  Activity,
  Server,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { syncUserProfile, getUserHistory, stopValidation, getBatchInfo, getActiveServer } from '@/app/actions/backend';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  country_code?: string;
  country_name?: string;
  status: 'success' | 'invalid' | 'fake' | 'failed';
  timestamp: string;
  provider?: string;
  error?: string;
  phonevalidator?: {
    line_type?: string;
    fake_number: string;
    fake_reason: string;
    outside_us: string;
  };
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState('');
  const [region, setRegion] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [liveJson, setLiveJson] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeServer, setActiveServer] = useState<1 | 2>(1);
  const [counts, setCounts] = useState({ 
    mobile: 0, 
    landline: 0, 
    voip: 0, 
    toll_free: 0, 
    invalid: 0, 
    fake: 0, 
    failed: 0 
  });
  const [showCreditModal, setShowCreditModal] = useState({ open: false, available: 0, requested: 0 });
  const [lastIndex, setLastIndex] = useState(0);
  const [batchInfo, setBatchInfo] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    
    const initialLoad = async () => {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setCredits(userData.credits || 0);
        } catch(e) {}
      }
      const savedRegion = typeof window !== 'undefined' ? localStorage.getItem('numcheckr_region') : null;
      if (savedRegion) setRegion(savedRegion);

      fetchInitialBatchInfo();
      fetchHistory();
    };

    initialLoad();

    const interval = setInterval(async () => {
      if (!isProcessing) {
        const res = await getActiveServer();
        if (res.success && res.activeServer !== activeServer) {
          setActiveServer(res.activeServer as 1 | 2);
          fetchInitialBatchInfo();
        }
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isProcessing) {
        fetchInitialBatchInfo();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeServer, isProcessing]);

  const fetchInitialBatchInfo = async () => {
    try {
      const res = await getBatchInfo();
      if (res.success) {
        setBatchInfo(res);
        setActiveServer(res.activeServer);
        return res;
      }
    } catch (e) {
      console.error("Batch info sync failed");
    }
    return null;
  };

  const fetchAndSyncProfile = async () => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) return;
    try {
      const userData = JSON.parse(userStr);
      const email = userData.email || userData.data?.email || userData.user?.email;
      if (!email) return;
      setIsSyncing(true);
      const res = await syncUserProfile(email);
      if (res.success) {
        setCredits(res.credits);
        const updatedUser = { ...userData, credits: res.credits };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: res.credits } }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchHistory = async () => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
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
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const extractedNumbers = rows
          .map(row => String(row[0] || '').trim())
          .filter(num => num.length >= 3);

        if (extractedNumbers.length > 0) {
          setNumberInput(prev => {
            const separator = prev.endsWith('\n') || prev === '' ? '' : '\n';
            return prev + separator + extractedNumbers.join('\n');
          });
          toast({ title: "Success", description: `${extractedNumbers.length} numbers imported.` });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Invalid file format." });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadSingleResult = (res: ValidationResult) => {
    const content = `Number: ${res.number}\nStatus: ${res.status.toUpperCase()}\nType: ${res.type}\nCarrier: ${res.carrier}\nLocation: ${res.location}\nProvider: ${res.provider || 'Core 1'}${res.phonevalidator ? `\nFake Reason: ${res.phonevalidator.fake_reason}\nOutside US: ${res.phonevalidator.outside_us}` : ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${res.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeNum = (num: string) => String(num || '').replace(/[^\d]/g, '');

  const handleStart = async (resume = false) => {
    const allLines = numberInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (allLines.length === 0) return;

    if (!batchInfo) {
      toast({ variant: "destructive", title: "System Initializing", description: "Loading server configuration..." });
      fetchInitialBatchInfo();
      return;
    }

    if (batchInfo.keysAvailable === false) {
      toast({ variant: "destructive", title: "Service Unavailable", description: "Active server out of keys." });
      return;
    }

    setIsProcessing(true);
    stopRequestedRef.current = false;
    
    if (!resume) {
      setProgress(0);
      setResults(allLines.map(num => ({ 
        id: Math.random().toString(36), 
        number: num, 
        type: 'Pending', 
        carrier: '—', 
        location: '—', 
        status: 'invalid', 
        timestamp: new Date().toISOString() 
      })));
      setCounts({ mobile: 0, landline: 0, voip: 0, toll_free: 0, invalid: 0, fake: 0, failed: 0 });
      setLastIndex(0);
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    if (!email) {
      setIsProcessing(false);
      return;
    }

    const batchSize = batchInfo.recommendedBatchSize || 25;
    let currentIndex = resume ? lastIndex : 0;

    while (currentIndex < allLines.length && !stopRequestedRef.current) {
      const chunk = allLines.slice(currentIndex, currentIndex + batchSize);
      try {
        await processChunk(email, chunk, allLines.length);
        currentIndex += chunk.length;
        setLastIndex(currentIndex);
      } catch (err: any) {
        if (err.message === 'NO_CREDITS' || err.name === 'AbortError') break;
        console.error("Batch processing failed:", err);
        break;
      }
    }

    setIsProcessing(false);
    fetchAndSyncProfile();
  };

  const processChunk = async (email: string, chunk: string[], totalCount: number) => {
    abortControllerRef.current = new AbortController();

    const response = await fetch('https://numcheckr.onrender.com/api/user/validate-distributed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, numbers: chunk, region }),
      signal: abortControllerRef.current.signal
    });

    if (!response.body) throw new Error("Connection failed");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const dataStr = event.replace(/^data: /, '').trim();
        if (!dataStr) continue;
        
        try {
          const data = JSON.parse(dataStr);

          if (Array.isArray(data)) {
            setResults(prev => {
              const next = [...prev];
              data.forEach((item: any) => {
                const normItemNum = normalizeNum(item.number);
                const targetIdx = next.findIndex(r => normalizeNum(r.number) === normItemNum && r.type === 'Pending');
                
                if (targetIdx !== -1) {
                  let finalStatus: any = 'invalid';
                  const typeLower = (item.line_type || '').toLowerCase();

                  // --- REVISED STATUS LOGIC: Prioritize valid field over error string for Server 1 ---
                  if (item.valid !== undefined && item.valid !== null) {
                    if (item.valid === true) {
                      finalStatus = 'success';
                      if (typeLower.includes('mobile')) setCounts(c => ({...c, mobile: c.mobile + 1}));
                      else if (typeLower.includes('landline')) setCounts(c => ({...c, landline: c.landline + 1}));
                      else if (typeLower.includes('voip')) setCounts(c => ({...c, voip: c.voip + 1}));
                      else if (typeLower.includes('toll_free')) setCounts(c => ({...c, toll_free: c.toll_free + 1}));
                      else setCounts(c => ({...c, mobile: c.mobile + 1}));
                    } else {
                      // Result is false (invalid number)
                      if (item.phonevalidator?.fake_number?.toUpperCase() === 'YES') {
                        finalStatus = 'fake';
                        setCounts(c => ({...c, fake: c.fake + 1}));
                      } else {
                        finalStatus = 'invalid';
                        setCounts(c => ({...c, invalid: c.invalid + 1}));
                      }
                    }
                  } else if (item.error) {
                    // Only mark as failed if there is an error AND no valid field present
                    finalStatus = 'failed';
                    setCounts(c => ({...c, failed: c.failed + 1}));
                  } else {
                    // Fallback to invalid if no status found
                    finalStatus = 'invalid';
                    setCounts(c => ({...c, invalid: c.invalid + 1}));
                  }

                  next[targetIdx] = {
                    ...next[targetIdx],
                    type: item.valid === true ? (item.line_type || 'Valid') : (item.error ? 'Failed' : (item.line_type || 'Invalid')),
                    carrier: item.carrier || '—',
                    location: item.location || item.country_name || '—',
                    country_code: item.country_code,
                    country_name: item.country_name,
                    status: finalStatus,
                    provider: item.provider,
                    phonevalidator: item.phonevalidator,
                    error: item.error,
                    timestamp: new Date().toISOString()
                  };
                }
              });
              
              const processedCount = next.filter(r => r.type !== 'Pending').length;
              setProgress(Math.round((processedCount / totalCount) * 100));
              return next;
            });
            setLiveJson(data[data.length - 1]);
            continue;
          }

          if (data.status === "DONE" || data.status === "PAUSED") {
            await reader.cancel();
            return;
          }
          if (data.status === "NO_CREDITS") {
            await reader.cancel();
            setShowCreditModal({ 
              open: true, 
              available: data.available || credits, 
              requested: data.requested || chunk.length 
            });
            throw new Error('NO_CREDITS');
          }
        } catch (e) {}
      }
    }
  };

  const handleStop = async () => {
    stopRequestedRef.current = true;
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    if (email) stopValidation(email); 
    abortControllerRef.current?.abort(); 
    setIsProcessing(false);
  };

  const downloadResults = (filter?: string) => {
    let filtered = results.filter(r => r.type !== 'Pending');
    
    if (filter) {
      if (filter === 'valid') filtered = filtered.filter(r => r.status === 'success');
      else if (filter === 'invalid') filtered = filtered.filter(r => r.status === 'invalid');
      else if (filter === 'fake') filtered = filtered.filter(r => r.status === 'fake');
      else if (filter === 'failed') filtered = filtered.filter(r => r.status === 'failed');
      else if (filter === 'mobile') filtered = filtered.filter(r => r.status === 'success' && r.type.toLowerCase().includes('mobile'));
      else if (filter === 'landline') filtered = filtered.filter(r => r.status === 'success' && r.type.toLowerCase().includes('landline'));
      else if (filter === 'voip') filtered = filtered.filter(r => r.status === 'success' && r.type.toLowerCase().includes('voip'));
      else if (filter === 'toll_free') filtered = filtered.filter(r => r.status === 'success' && r.type.toLowerCase().includes('toll_free'));
    }

    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "Empty Export", description: "No data available." });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filtered.map(r => ({
      Number: r.number,
      Status: r.status.toUpperCase(),
      Type: r.type,
      Carrier: r.carrier,
      Location: r.location,
      Provider: r.provider || 'Core 1',
      CountryCode: r.country_code || '',
      FakeReason: r.phonevalidator?.fake_reason || '',
      OutsideUS: r.phonevalidator?.outside_us || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `results_${filter || 'all'}_${new Date().getTime()}.xlsx`);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <TabsList className="bg-card/60 p-1 rounded-2xl h-14 w-fit">
              <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs">Validation Engine</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black italic uppercase text-xs">Activity Logs</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 px-2">
               <div className={cn(
                 "h-2 w-2 rounded-full animate-pulse",
                 activeServer === 2 ? "bg-accent" : "bg-primary"
               )} />
               <span className="text-[9px] font-black uppercase opacity-60">
                 System: {activeServer === 2 ? "Core 2 (PV v4)" : "Core 1 (Standard)"}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20">
            {batchInfo && (
              <div className="hidden md:flex flex-col items-start mr-4 border-r border-primary/20 pr-4">
                <span className="text-[9px] font-black uppercase text-primary/60">Cycle Units</span>
                <span className="text-xs font-black italic flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" /> 
                  {batchInfo.recommendedBatchSize} units
                </span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary/70">Wallet</span>
              <span className="text-2xl font-black italic">{Math.max(0, credits)}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchAndSyncProfile} disabled={isSyncing} className="rounded-xl">
              <RefreshCcw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <TabsContent value="tool" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <Card className="border-white/10 bg-card shadow-2xl overflow-hidden">
                <div className={cn("h-1 w-full", activeServer === 2 ? "bg-accent" : "bg-primary")} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                    <Terminal className="h-3 w-3" /> Input Queue
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 rounded-lg text-[10px] font-black uppercase bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Import
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Enter numbers (one per line)..." 
                    value={numberInput} 
                    onChange={e => setNumberInput(e.target.value)} 
                    className="min-h-[300px] font-code text-xs bg-muted/20 border-white/5 resize-none" 
                    disabled={isProcessing} 
                  />

                  {activeServer === 2 && (
                    <div className="space-y-2 p-4 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="flex items-center justify-between mb-2">
                         <label className="text-[10px] font-black uppercase text-accent tracking-widest">Global Region</label>
                      </div>
                      <Select value={region} onValueChange={(val) => { setRegion(val); localStorage.setItem('numcheckr_region', val); }}>
                        <SelectTrigger className="bg-black/40 border-white/10 h-10 rounded-xl">
                          <SelectValue placeholder="Region 1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Region 1 (Fast)</SelectItem>
                          <SelectItem value="2">Region 2 (Stable)</SelectItem>
                          <SelectItem value="3">Region 3 (Balanced)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleStart()} disabled={isProcessing} className="h-14 bg-primary font-black italic rounded-xl text-lg group">
                      {isProcessing ? <Loader2 className="animate-spin" /> : <><Play className="mr-2 h-4 w-4 group-hover:fill-current" /> START</>}
                    </Button>
                    <Button 
                      onClick={handleStop} 
                      disabled={!isProcessing} 
                      variant="destructive" 
                      className="h-14 font-black italic rounded-xl"
                    >
                      <Square className="mr-2 h-4 w-4 fill-current" /> STOP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 rounded-2xl border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <Code2 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Metadata Flow</span>
                </div>
                <ScrollArea className="h-[150px] p-4 font-code text-[10px] text-primary/80">
                  {liveJson ? <pre className="whitespace-pre-wrap">{JSON.stringify(liveJson, null, 2)}</pre> : <div className="opacity-20 text-center pt-6 italic uppercase">Awaiting activity...</div>}
                </ScrollArea>
              </Card>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <Card onClick={() => downloadResults('mobile')} className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-green-500 mb-1">Mobile</p>
                  <h3 className="text-2xl font-black italic">{counts.mobile}</h3>
                </Card>
                <Card onClick={() => downloadResults('landline')} className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-blue-500 mb-1">Landline</p>
                  <h3 className="text-2xl font-black italic">{counts.landline}</h3>
                </Card>
                <Card onClick={() => downloadResults('voip')} className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-purple-500 mb-1">VOIP</p>
                  <h3 className="text-2xl font-black italic">{counts.voip}</h3>
                </Card>
                <Card onClick={() => downloadResults('toll_free')} className="bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-cyan-500 mb-1">Toll Free</p>
                  <h3 className="text-2xl font-black italic">{counts.toll_free}</h3>
                </Card>
                <Card onClick={() => downloadResults('fake')} className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-amber-500 mb-1">Fake</p>
                  <h3 className="text-2xl font-black italic">{counts.fake}</h3>
                </Card>
                <Card onClick={() => downloadResults('invalid')} className="bg-red-500/5 p-3 rounded-xl border border-red-500/10 text-center cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-red-500 mb-1">Invalid</p>
                  <h3 className="text-2xl font-black italic">{counts.invalid}</h3>
                </Card>
                <Card onClick={() => downloadResults('failed')} className="bg-white/5 p-3 rounded-xl border border-white/10 text-center cursor-pointer opacity-60 hover:scale-105 active:scale-95 transition-all">
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Failed</p>
                  <h3 className="text-2xl font-black italic">{counts.failed}</h3>
                </Card>
              </div>

              <div className="bg-card/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex justify-between items-end mb-3 px-1">
                   <div className="space-y-1">
                     <span className="text-[10px] font-black uppercase opacity-50 block">Live Progress</span>
                   </div>
                   <span className="text-xl font-black italic text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/5 border border-white/5" />
              </div>

              <Card className="bg-card/60 rounded-3xl overflow-hidden border-white/5 shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", isProcessing ? "bg-green-500 animate-pulse" : "bg-primary")} />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Real-time Stream</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-9 rounded-xl text-[9px] font-black uppercase border-white/5 hover:bg-green-500/10 hover:text-green-500" onClick={() => downloadResults('valid')}>Export Valid</Button>
                    <Button size="sm" variant="outline" className="h-9 rounded-xl text-[9px] font-black uppercase border-white/5 hover:bg-primary/10 hover:text-primary" onClick={() => downloadResults()}>Full Export</Button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Phone Number</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status / Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Core</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-80 text-center opacity-20 font-black italic uppercase tracking-[0.2em]">Awaiting Input Queue</TableCell></TableRow>
                      ) : (
                        results.map(res => (
                          <TableRow 
                            key={res.id} 
                            onClick={() => res.type !== 'Pending' && downloadSingleResult(res)}
                            className={cn(
                              "h-20 border-white/5 hover:bg-white/5 transition-colors group cursor-pointer",
                              res.type === 'Pending' && "cursor-wait opacity-50"
                            )}
                          >
                            <TableCell className="px-8">
                              <div className="flex flex-col">
                                <span className="font-code font-black text-primary text-base flex items-center gap-2">
                                  {res.number}
                                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(res.number); toast({ title: "Copied", description: "Number copied." }); }} />
                                </span>
                                <span className="text-[9px] font-bold opacity-30 uppercase">{res.timestamp.split('T')[1].split('.')[0]}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <Badge className={cn(
                                  res.status === 'success' ? 'bg-green-500/10 text-green-500' : (res.status === 'fake' ? 'bg-amber-500/10 text-amber-500' : (res.status === 'failed' ? 'bg-red-900/40 text-red-200' : 'bg-red-500/10 text-red-500')),
                                  "border-none text-[9px] font-black px-3 py-1 uppercase w-fit"
                                )}>
                                  {res.type}
                                </Badge>
                                {res.phonevalidator?.fake_number?.toUpperCase() === 'YES' && (
                                  <span className="text-[8px] font-black text-amber-500/70 uppercase flex items-center gap-1">
                                    <AlertTriangle className="h-2 w-2" /> {res.phonevalidator.fake_reason || 'Burner Number Detected'}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-black italic">{res.location}</span>
                                <span className="text-[9px] font-bold uppercase opacity-40">{res.country_code ? `${res.country_code} - ${res.country_name}` : ''}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-bold italic opacity-70">{res.carrier}</TableCell>
                            <TableCell className="text-right px-8">
                              <div className="flex flex-col items-end gap-2">
                                {res.provider === 'phonevalidator' ? (
                                  <Badge variant="outline" className="text-[8px] font-black border-accent/30 text-accent uppercase tracking-tighter">Core 2</Badge>
                                ) : (
                                  res.type !== 'Pending' && <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary uppercase tracking-tighter">Core 1</Badge>
                                )}
                              </div>
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

        <TabsContent value="history">
          <Card className="border-white/5 bg-card/60 rounded-3xl overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <h3 className="text-xl font-black italic uppercase tracking-tighter">Activity History</h3>
               <Button variant="ghost" size="sm" onClick={fetchHistory} className="h-8 rounded-lg font-black uppercase text-[10px]"><RefreshCcw className="h-3 w-3 mr-2" /> Refresh</Button>
             </div>
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-muted/10">
                   <TableRow className="border-white/5">
                     <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest">Details</TableHead>
                     <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Impact</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {history.length === 0 ? (
                     <TableRow><TableCell colSpan={3} className="h-40 text-center opacity-20 italic font-black uppercase">No logs detected</TableCell></TableRow>
                   ) : (
                     history.map((item, i) => (
                       <TableRow key={i} className="h-20 border-white/5 hover:bg-white/5 transition-colors">
                         <TableCell className="px-8 text-xs font-code opacity-60">{item.date ? new Date(item.date).toLocaleString() : 'N/A'}</TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black italic text-sm">{item.description}</span>
                              <Badge variant="outline" className="w-fit text-[8px] font-black uppercase mt-1 border-white/10 opacity-50">{item.type || 'TASK'}</Badge>
                            </div>
                         </TableCell>
                         <TableCell className="text-right px-8">
                           <div className="flex flex-col items-end">
                             <span className={cn("text-xl font-black italic", item.type === 'Payment' ? 'text-green-500' : 'text-primary')}>{item.amount || '0'}</span>
                             <span className="text-[8px] font-black uppercase opacity-30">Units</span>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreditModal.open} onOpenChange={(open) => setShowCreditModal(s => ({...s, open}))}>
        <DialogContent className="border-primary/20 bg-card rounded-3xl max-w-md shadow-2xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <div className="p-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-6 border border-destructive/20">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Credit Depleted</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm font-bold text-muted-foreground uppercase py-4 space-y-2">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span>Requested:</span>
                    <span className="text-white">{showCreditModal.requested} Units</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span>Available:</span>
                    <span className="text-destructive">{showCreditModal.available} Units</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center mt-6">
              <Button onClick={() => window.location.href = '/credits'} className="w-full h-16 bg-primary text-white font-black italic rounded-2xl text-xl shadow-lg hover:shadow-primary/20 transition-all">
                <CreditCard className="mr-2 h-6 w-6" /> RECHARGE NOW
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
