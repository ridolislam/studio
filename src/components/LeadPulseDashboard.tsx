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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { syncUserProfile, getUserHistory, stopValidation, getBatchInfo } from '@/app/actions/backend';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  status: 'success' | 'invalid' | 'fake' | 'failed';
  timestamp: string;
  provider?: string;
  phonevalidator?: {
    fake_number: string;
    fake_reason: string;
    outside_us: string;
  };
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState('');
  const [region, setRegion] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [liveJson, setLiveJson] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, invalid: 0, fake: 0 });
  const [showCreditModal, setShowCreditModal] = useState({ open: false, available: 0, requested: 0 });
  const [lastIndex, setLastIndex] = useState(0);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCredits(userData.credits || 0);
      } catch(e) {}
    }
    const savedRegion = localStorage.getItem('numcheckr_region');
    if (savedRegion) setRegion(savedRegion);

    fetchAndSyncProfile();
    fetchHistory();
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
        const updatedUser = { ...userData, credits: res.credits };
        localStorage.setItem('user', JSON.stringify(updatedUser));
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

  const handleStart = async (resume = false) => {
    const lines = numberInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (lines.length === 0) return;

    const userStr = localStorage.getItem('user');
    const userData = JSON.parse(userStr || '{}');
    const email = userData.email || userData.data?.email || userData.user?.email;
    if (!email) return;

    setIsProcessing(true);
    if (!resume) {
      setProgress(0);
      setResults(lines.map(num => ({ id: Math.random().toString(36), number: num, type: 'Pending', carrier: '—', location: '—', status: 'invalid', timestamp: new Date().toISOString() })));
      setCounts({ mobile: 0, landline: 0, invalid: 0, fake: 0 });
      setLastIndex(0);
    }

    abortControllerRef.current = new AbortController();
    const numbersToProcess = resume ? lines.slice(lastIndex) : lines;

    try {
      const response = await fetch('https://numcheckr.onrender.com/api/user/validate-distributed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, numbers: numbersToProcess, region }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error("No stream body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataStr = part.replace(/^data: /, '').trim();
          if (!dataStr) continue;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.status === "DONE") {
              toast({ title: "Task Complete", description: "All numbers processed." });
              break;
            }
            if (data.status === "NO_CREDITS") {
              setShowCreditModal({ open: true, available: data.available || credits, requested: data.requested || lines.length });
              break;
            }
            if (data.status === "PAUSED") {
              setLastIndex(prev => prev + (data.lastIndex || 0));
              setIsProcessing(false);
              break;
            }

            if (Array.isArray(data)) {
              setResults(prev => {
                const next = [...prev];
                data.forEach((item: any) => {
                  const idx = next.findIndex(r => r.number === item.number && r.type === 'Pending');
                  if (idx !== -1) {
                    const status: any = item.error ? 'failed' : (item.valid ? 'success' : (item.phonevalidator?.fake_number === 'YES' ? 'fake' : 'invalid'));
                    next[idx] = {
                      ...next[idx],
                      type: item.error ? 'Failed' : (item.line_type || 'Invalid'),
                      carrier: item.carrier || '—',
                      location: item.location || item.country_name || '—',
                      status,
                      provider: item.provider,
                      phonevalidator: item.phonevalidator,
                      timestamp: new Date().toISOString()
                    };
                    
                    if (status === 'success') {
                      if (item.line_type?.toLowerCase().includes('mobile')) setCounts(c => ({...c, mobile: c.mobile + 1}));
                      else setCounts(c => ({...c, landline: c.landline + 1}));
                    } else if (status === 'fake') setCounts(c => ({...c, fake: c.fake + 1}));
                    else if (status === 'invalid') setCounts(c => ({...c, invalid: c.invalid + 1}));
                  }
                });
                const processed = next.filter(r => r.type !== 'Pending').length;
                setProgress(Math.round((processed / lines.length) * 100));
                return next;
              });
              setLiveJson(data[data.length - 1]);
            }
          } catch (e) {}
        }
      }
    } finally {
      setIsProcessing(false);
      fetchAndSyncProfile();
    }
  };

  const downloadResults = (filter?: 'valid' | 'invalid' | 'failed') => {
    let filtered = results;
    if (filter === 'valid') filtered = results.filter(r => r.status === 'success');
    else if (filter === 'invalid') filtered = results.filter(r => r.status === 'invalid' || r.status === 'fake');
    else if (filter === 'failed') filtered = results.filter(r => r.status === 'failed');

    const ws = XLSX.utils.json_to_sheet(filtered.map(r => ({
      Number: r.number,
      Status: r.status,
      Type: r.type,
      Carrier: r.carrier,
      Location: r.location,
      Provider: r.provider || 'S1',
      Fake: r.phonevalidator?.fake_number || 'N/A',
      FakeReason: r.phonevalidator?.fake_reason || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "numcheckr_results");
    XLSX.writeFile(wb, `results_${filter || 'all'}.xlsx`);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <TabsList className="bg-card/60 p-1 rounded-2xl h-14">
            <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs">Validation</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black italic uppercase text-xs">History</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary/70">Credits</span>
              <span className="text-2xl font-black italic">{Math.max(0, credits)}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchAndSyncProfile} disabled={isSyncing} className="rounded-xl"><RefreshCcw className={cn("h-5 w-5", isSyncing && "animate-spin")} /></Button>
          </div>
        </div>

        <TabsContent value="tool" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <Card className="border-white/10 bg-card shadow-2xl overflow-hidden">
                <div className="h-1 bg-primary w-full" />
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase text-primary">Bulk Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Numbers list..." 
                    value={numberInput} 
                    onChange={e => setNumberInput(e.target.value)} 
                    className="min-h-[300px] font-code text-xs bg-muted/20 border-white/5" 
                    disabled={isProcessing} 
                  />

                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-black italic uppercase text-[10px] h-10">
                        Advanced Options <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase opacity-50">API Region (Server 2 Only)</label>
                        <Select value={region} onValueChange={(val) => { setRegion(val); localStorage.setItem('numcheckr_region', val); }}>
                          <SelectTrigger className="bg-black/40 border-white/10 h-10 rounded-xl">
                            <SelectValue placeholder="Select Region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Region 1 (Default)</SelectItem>
                            <SelectItem value="2">Region 2</SelectItem>
                            <SelectItem value="3">Region 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleStart()} disabled={isProcessing} className="h-14 bg-primary font-black italic rounded-xl">
                      {isProcessing ? <Loader2 className="animate-spin" /> : "START"}
                    </Button>
                    <Button onClick={async () => { await stopValidation(JSON.parse(localStorage.getItem('user') || '{}').email); abortControllerRef.current?.abort(); setIsProcessing(false); }} disabled={!isProcessing} variant="destructive" className="h-14 font-black italic rounded-xl">
                      STOP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 rounded-2xl border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center gap-2"><Terminal className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase">Stream Data</span></div>
                <ScrollArea className="h-[200px] p-4 font-code text-[10px] text-green-400">
                  {liveJson ? <pre>{JSON.stringify(liveJson, null, 2)}</pre> : <div className="opacity-20 text-center pt-10 uppercase italic">Idle</div>}
                </ScrollArea>
              </Card>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-green-500/5 p-4 rounded-2xl border-2 border-green-500/20">
                  <p className="text-[10px] font-black uppercase text-green-500">Mobile</p>
                  <h3 className="text-3xl font-black italic">{counts.mobile}</h3>
                </Card>
                <Card className="bg-blue-500/5 p-4 rounded-2xl border-2 border-blue-500/20">
                  <p className="text-[10px] font-black uppercase text-blue-500">Landline</p>
                  <h3 className="text-3xl font-black italic">{counts.landline}</h3>
                </Card>
                <Card className="bg-amber-500/5 p-4 rounded-2xl border-2 border-amber-500/20">
                  <p className="text-[10px] font-black uppercase text-amber-500">Fake</p>
                  <h3 className="text-3xl font-black italic">{counts.fake}</h3>
                </Card>
                <Card className="bg-red-500/5 p-4 rounded-2xl border-2 border-red-500/20">
                  <p className="text-[10px] font-black uppercase text-red-500">Invalid</p>
                  <h3 className="text-3xl font-black italic">{counts.invalid}</h3>
                </Card>
              </div>

              <div className="bg-card/40 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between px-1 mb-2">
                   <span className="text-[10px] font-black uppercase opacity-50">Progress</span>
                   <span className="text-[10px] font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <Card className="bg-card/60 rounded-3xl overflow-hidden border-white/5">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between">
                  <span className="text-xs font-black uppercase opacity-70">Validation Results</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase" onClick={() => downloadResults('valid')}>Valid Only</Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase" onClick={() => downloadResults()}>Full Export</Button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="px-8 text-[10px] font-black uppercase">Number</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Location</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Carrier</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase">Server</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20 font-black italic uppercase">Results will stream here</TableCell></TableRow>
                      ) : (
                        results.map(res => (
                          <TableRow key={res.id} className="h-16 border-white/5">
                            <TableCell className="px-8 font-code font-black text-primary">{res.number}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                res.status === 'success' ? 'bg-green-500/10 text-green-500' : (res.status === 'fake' ? 'bg-amber-500/10 text-amber-500' : (res.status === 'failed' ? 'bg-red-900/40 text-red-200' : 'bg-red-500/10 text-red-500')),
                                "border-none text-[9px] font-black px-3 uppercase"
                              )}>
                                {res.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-bold opacity-60">{res.location}</TableCell>
                            <TableCell className="text-xs font-bold italic">{res.carrier}</TableCell>
                            <TableCell className="text-right px-8">
                              {res.provider === 'phonevalidator' ? <Badge variant="outline" className="text-[7px] border-accent/30 text-accent">V4</Badge> : (res.type !== 'Pending' && <Badge variant="outline" className="text-[7px] border-primary/30 text-primary">V1</Badge>)}
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
          <Card className="border-white/5 bg-card/60 rounded-3xl overflow-hidden">
             <Table>
               <TableHeader className="bg-muted/10">
                 <TableRow>
                   <TableHead className="px-8 py-6 text-[10px] font-black uppercase">Date</TableHead>
                   <TableHead className="text-[10px] font-black uppercase">Details</TableHead>
                   <TableHead className="text-right px-8 text-[10px] font-black uppercase">Impact</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {history.map((item, i) => (
                   <TableRow key={i} className="h-16 border-white/5">
                     <TableCell className="px-8 text-xs font-code opacity-60">{new Date(item.date).toLocaleString()}</TableCell>
                     <TableCell className="font-bold italic text-sm">{item.description}</TableCell>
                     <TableCell className="text-right px-8 text-lg font-black italic text-primary">{item.amount}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreditModal.open} onOpenChange={(open) => setShowCreditModal(s => ({...s, open}))}>
        <DialogContent className="border-primary/20 bg-card rounded-3xl max-w-md">
          <DialogHeader className="text-center">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
            <DialogTitle className="text-2xl font-black italic uppercase">Insufficient Credits</DialogTitle>
            <DialogDescription className="font-bold text-muted-foreground uppercase py-2">
              Requested: <span className="text-primary">{showCreditModal.requested}</span> | 
              Available: <span className="text-primary">{showCreditModal.available}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => window.location.href = '/credits'} className="w-full h-14 bg-primary text-white font-black italic rounded-xl">BUY CREDITS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
