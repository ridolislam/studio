
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
  Code2,
  AlertTriangle,
  CreditCard,
  Activity,
  Copy,
  Search,
  CheckCircle2,
  ShieldAlert
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { syncUserProfile, getUserHistory, getBatchInfo } from '@/app/actions/backend';
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
  phonevalidator?: any;
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
  const [activeServer, setActiveServer] = useState<1 | 2>(1);
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, voip: 0, toll_free: 0, invalid: 0, fake: 0, failed: 0 });
  const [showCreditModal, setShowCreditModal] = useState({ open: false, available: 0, requested: 0 });
  const [batchInfo, setBatchInfo] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const stopRequestedRef = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const loadInitialData = async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          const currentCredits = userData.credits || 0;
          setCredits(currentCredits);
        } catch(e) {}
      }
      
      try {
        const res = await getBatchInfo();
        if (res.success) {
          setBatchInfo(res);
          setActiveServer(res.activeServer);
        }
      } catch (e) {}
      fetchHistory();
    };
    loadInitialData();
    return () => { isMounted.current = false; };
  }, []);

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
        setCredits(res.credits);
        localStorage.setItem('user', JSON.stringify({ ...userData, credits: res.credits }));
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: res.credits } }));
      }
    } finally {
      setIsSyncing(false);
    }
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
          toast({ title: "Success", description: `${extracted.length} numbers imported.` });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Invalid file." });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStart = async () => {
    const allNumbers = numberInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (allNumbers.length === 0) return;

    // IMMEDIATE EXECUTION: No pre-processing, no pending rows
    setIsProcessing(true);
    stopRequestedRef.current = false;
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

    const batchSize = batchInfo?.recommendedBatchSize || 25;
    const total = allNumbers.length;
    let processedCount = 0;

    // Split numbers into chunks
    const chunks = [];
    for (let i = 0; i < allNumbers.length; i += batchSize) {
      chunks.push(allNumbers.slice(i, i + batchSize));
    }

    // Parallel processing with a concurrency of 3 batches
    const concurrency = 3;
    let index = 0;

    const runWorker = async () => {
      while (index < chunks.length && !stopRequestedRef.current) {
        const chunkIndex = index++;
        const currentChunk = chunks[chunkIndex];

        try {
          const res = await executeBatch(email, currentChunk);
          if (res === 'STOP') {
            stopRequestedRef.current = true;
            break;
          }
          processedCount += currentChunk.length;
          setProgress(Math.round((processedCount / total) * 100));
        } catch (e) {
          console.error("Batch processing failed", e);
        }
      }
    };

    // Start workers in parallel
    const workers = Array(Math.min(concurrency, chunks.length)).fill(null).map(() => runWorker());
    
    Promise.all(workers).then(() => {
      setIsProcessing(false);
      fetchAndSyncProfile();
      fetchHistory();
    });
  };

  const executeBatch = async (email: string, numbers: string[]) => {
    try {
      const response = await fetch('https://numcheckr.onrender.com/api/user/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, numbers, region })
      });

      const data = await response.json();

      if (data.status === 'NO_CREDITS') {
        setShowCreditModal({ open: true, available: data.available, requested: numbers.length });
        return 'STOP';
      }

      if (data.success && Array.isArray(data.results)) {
        updateUI(data.results);
      }
      return 'CONTINUE';
    } catch (e) {
      return 'CONTINUE';
    }
  };

  const updateUI = (newResults: any[]) => {
    setResults(prev => [...newResults.map(item => ({
      id: Math.random().toString(36).substring(7),
      number: item.number,
      type: item.line_type || 'Unknown',
      carrier: item.carrier || '—',
      location: item.location || item.country_name || '—',
      status: item.valid === false ? 'invalid' : (item.phonevalidator?.fake_number?.toLowerCase() === 'yes' ? 'fake' : 'success'),
      timestamp: new Date().toISOString(),
      provider: item.provider
    })), ...prev].slice(0, 5000));

    newResults.forEach(item => {
      const type = (item.line_type || '').toLowerCase();
      const isFake = item.phonevalidator?.fake_number?.toLowerCase() === 'yes';
      
      setCounts(c => {
        const next = { ...c };
        if (isFake) next.fake += 1;
        else if (item.valid === false) next.invalid += 1;
        else if (type.includes('mobile')) next.mobile += 1;
        else if (type.includes('landline')) next.landline += 1;
        else if (type.includes('voip')) next.voip += 1;
        else if (type.includes('toll')) next.toll_free += 1;
        else next.invalid += 1;
        return next;
      });
    });
    
    if (newResults.length > 0) {
      setLiveJson(newResults[newResults.length - 1]);
    }
  };

  const handleStop = () => {
    stopRequestedRef.current = true;
    setIsProcessing(false);
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
      else if (filter === 'failed') filtered = results.filter(r => r.status === 'failed');
    }
    
    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No results to download for this category." });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `numcheckr_${filter || 'all'}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <TabsList className="bg-card/60 p-1 rounded-2xl h-14">
              <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs">Validator</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black italic uppercase text-xs">Logs</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 px-2">
               <div className={cn("h-2 w-2 rounded-full", activeServer === 2 ? "bg-accent" : "bg-primary animate-pulse")} />
               <span className="text-[9px] font-black uppercase opacity-60">
                 {activeServer === 2 ? "Core 2 Distributed Active" : "Core 1 Standard Active"}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary/70">Wallet Balance</span>
              <span className="text-2xl font-black italic">{credits}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchAndSyncProfile} disabled={isSyncing} className="rounded-xl">
              <RefreshCcw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <TabsContent value="tool" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className="xl:col-span-1 border-white/10 bg-card shadow-2xl overflow-hidden">
              <div className={cn("h-1 w-full", activeServer === 2 ? "bg-accent" : "bg-primary")} />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2"><Terminal className="h-3 w-3" /> Input Console</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-[10px] font-black uppercase bg-primary/5">Import File</Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Paste numbers (one per line)..." 
                  value={numberInput} 
                  onChange={e => setNumberInput(e.target.value)} 
                  className="min-h-[350px] font-code text-xs bg-muted/20 border-white/5 resize-none placeholder:opacity-30" 
                  disabled={isProcessing} 
                />
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase opacity-50 ml-1">Traffic Region</label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Region 1 (USA/EU)</SelectItem>
                      <SelectItem value="2">Region 2 (Global)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button onClick={handleStart} disabled={isProcessing} className="h-16 bg-primary font-black italic rounded-xl text-xl shadow-lg shadow-primary/20">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "START"}
                  </Button>
                  <Button onClick={handleStop} disabled={!isProcessing} variant="destructive" className="h-16 font-black italic rounded-xl">STOP</Button>
                </div>
              </CardContent>
            </Card>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {[
                  { label: 'Mobile', count: counts.mobile, color: 'green', id: 'mobile' },
                  { label: 'Landline', count: counts.landline, color: 'blue', id: 'landline' },
                  { label: 'VOIP', count: counts.voip, color: 'purple', id: 'voip' },
                  { label: 'Toll Free', count: counts.toll_free, color: 'cyan', id: 'toll_free' },
                  { label: 'Fake', count: counts.fake, color: 'amber', id: 'fake' },
                  { label: 'Invalid', count: counts.invalid, color: 'red', id: 'invalid' },
                  { label: 'Failed', count: counts.failed, color: 'white', id: 'failed' }
                ].map(item => (
                  <Card 
                    key={item.id} 
                    onClick={() => downloadResults(item.id)} 
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 group",
                      `bg-${item.color}-500/5 border-${item.color}-500/10`
                    )}
                  >
                    <p className={cn(`text-[9px] font-black uppercase mb-1 tracking-widest opacity-60 group-hover:text-${item.color}-500`)}>{item.label}</p>
                    <h3 className="text-2xl font-black italic">{item.count}</h3>
                  </Card>
                ))}
              </div>

              <div className="bg-card/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex justify-between items-end mb-3">
                   <div className="flex items-center gap-2">
                     <Activity className="h-4 w-4 text-primary animate-pulse" />
                     <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Global Cycle Progress</span>
                   </div>
                   <span className="text-xl font-black italic text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/5" />
              </div>

              <Card className="bg-card/60 rounded-3xl overflow-hidden border-white/5 shadow-2xl backdrop-blur-xl">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Real-time Intelligence Feed</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase px-4 border-white/10 hover:bg-primary/10" onClick={() => downloadResults('mobile')}>Mobile Only</Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase px-4 border-white/10 hover:bg-primary/10" onClick={() => downloadResults()}>Export All</Button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Number Identity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Line Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Geo/Location</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Engine</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-80 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                              <Zap className="h-16 w-16" />
                              <p className="font-black italic uppercase text-xl tracking-tighter">Distributed Worker Waiting</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        results.map(res => (
                          <TableRow key={res.id} className="h-16 border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="px-8 font-code font-black text-primary group-hover:scale-105 transition-transform origin-left">{res.number}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                res.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                                res.status === 'fake' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500',
                                "border-none text-[8px] font-black px-3 uppercase tracking-widest"
                              )}>{res.type}</Badge>
                            </TableCell>
                            <TableCell className="text-[11px] font-black italic">{res.location}</TableCell>
                            <TableCell className="text-[11px] font-bold italic opacity-60">{res.carrier}</TableCell>
                            <TableCell className="text-right px-8">
                               <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">{res.provider === 'phonevalidator' ? 'Core 2' : 'Core 1'}</Badge>
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
          <Card className="border-white/5 bg-card/60 rounded-3xl overflow-hidden p-6 shadow-2xl backdrop-blur-xl">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-lg"><Activity className="h-5 w-5 text-primary" /></div>
                 <h3 className="text-xl font-black italic uppercase tracking-tighter">Validation Logs</h3>
               </div>
               <Button variant="ghost" size="sm" onClick={fetchHistory} className="h-10 font-black uppercase text-[10px] bg-white/5 px-6 rounded-xl hover:bg-primary/10">Sync Logs</Button>
             </div>
             <Table>
               <TableHeader className="bg-muted/10">
                 <TableRow className="border-white/5">
                   <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
                   <TableHead className="text-[10px] font-black uppercase tracking-widest">Transaction Details</TableHead>
                   <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest">Units Impact</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {history.length === 0 ? (
                   <TableRow><TableCell colSpan={3} className="h-60 text-center opacity-20 font-black italic uppercase">No Logs Synchronized</TableCell></TableRow>
                 ) : (
                   history.map((item, i) => (
                     <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                       <TableCell className="px-6 text-xs font-code opacity-60">{new Date(item.date).toLocaleString()}</TableCell>
                       <TableCell className="font-black italic text-sm">{item.description}</TableCell>
                       <TableCell className={`text-right px-6 font-black italic text-lg ${item.type === 'Payment' ? 'text-green-500' : 'text-primary'}`}>
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
        <DialogContent className="border-primary/20 bg-card rounded-[2rem] max-w-sm text-center shadow-3xl">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-6 border-2 border-destructive/20"><ShieldAlert className="h-10 w-10 text-destructive" /></div>
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">Cycle Blocked</DialogTitle>
          <DialogDescription className="font-bold uppercase text-[10px] tracking-widest opacity-60 mb-6">Insufficient units to complete current batch.</DialogDescription>
          <div className="py-2 font-black uppercase text-[10px] space-y-3 mb-8">
            <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5"><span>Available Units</span><span className="text-destructive text-lg font-black italic">{showCreditModal.available}</span></div>
            <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5"><span>Batch Requirement</span><span className="text-white text-lg font-black italic">{showCreditModal.requested}</span></div>
          </div>
          <Button onClick={() => window.location.href = '/credits'} className="w-full h-16 bg-primary font-black italic rounded-2xl text-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"><CreditCard className="mr-3 h-6 w-6" /> RECHARGE WALLET</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
