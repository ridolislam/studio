'use client';

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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  syncUserProfile, 
  getUserHistory,
  stopValidation
} from '@/app/actions/backend';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ValidationResult {
  id: string;
  number: string;
  type: string;
  carrier: string;
  location: string;
  status: 'success' | 'invalid';
  timestamp: string;
}

export default function LeadPulseDashboard() {
  const [numberInput, setNumberInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [liveJson, setLiveJson] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, invalid: 0 });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) {
      window.location.href = "/login";
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setCredits(userData.credits || 0);
    } catch(e) {}

    fetchAndSyncProfile();
    fetchHistory();

    const handleCreditUpdate = (event: any) => {
      if (event.detail && typeof event.detail.credits !== 'undefined') {
        setCredits(event.detail.credits);
      }
    };
    window.addEventListener('creditsUpdated', handleCreditUpdate);
    return () => window.removeEventListener('creditsUpdated', handleCreditUpdate);
  }, []);

  const fetchAndSyncProfile = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const userData = JSON.parse(userStr);
      const email = userData.email || (userData.data && userData.data.email) || (userData.user && userData.user.email);
      if (!email) return;

      setIsSyncing(true);
      const res = await syncUserProfile(email);
      if (res && res.success) {
        setCredits(res.credits);
        const updatedUser = { ...userData, credits: res.credits };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: res.credits } }));
      }
    } catch (e) {
      console.error('Profile sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchHistory = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const userData = JSON.parse(userStr);
      const email = userData.email || (userData.data && userData.data.email) || (userData.user && userData.user.email);
      if (!email) return;

      setIsLoadingHistory(true);
      const res = await getUserHistory({ email });
      if (res && res.success) {
        setHistory(Array.isArray(res.history) ? res.history : []);
      }
    } catch (e) {
      console.error('History fetch failed');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;

        let extracted: string[] = [];
        if (ext === 'xlsx' || ext === 'xls') {
          const wb = XLSX.read(data, { type: 'binary' });
          const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
          extracted = rows.flat()
            .map(c => String(c || '').replace(/[\s-()]/g, ''))
            .filter(c => /^\+?[0-9]{7,15}$/.test(c));
        } else {
          extracted = data.toString().split(/\r?\n/)
            .map(l => l.trim().replace(/[\s-()]/g, ''))
            .filter(l => /^\+?[0-9]{7,15}$/.test(l));
        }

        if (extracted.length > 0) {
          setNumberInput(prev => prev ? prev + '\n' + extracted.join('\n') : extracted.join('\n'));
          toast({ title: 'Extraction Success', description: `Found ${extracted.length} numbers.` });
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Invalid file format.' });
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (ext === 'xlsx' || ext === 'xls') reader.readAsBinaryString(file);
    else reader.readAsText(file);
  };

  const handleStart = async () => {
    const lines = numberInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (lines.length === 0) {
      toast({ variant: 'destructive', title: 'Input Empty', description: 'Please enter at least one number.' });
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const userData = JSON.parse(userStr);
    const email = userData.email || (userData.data && userData.data.email) || (userData.user && userData.user.email);
    if (!email) return;

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setCounts({ mobile: 0, landline: 0, invalid: 0 });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('https://numcheckr.onrender.com/api/user/validate-distributed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, numbers: lines }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error("No response body");

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
          if (!part.startsWith('data: ')) continue;
          const dataStr = part.replace('data: ', '').trim();
          
          try {
            if (dataStr.includes('"status":"DONE"')) {
              toast({ title: "Validation Complete", description: "All numbers processed." });
              break;
            }

            const data = JSON.parse(dataStr);
            
            if (Array.isArray(data)) {
              const newResults: ValidationResult[] = data.map((item: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                number: item.number,
                type: item.line_type || (item.valid ? 'Valid' : 'Invalid'),
                carrier: item.carrier || 'N/A',
                location: item.location || item.country_name || 'N/A',
                status: item.valid ? 'success' : 'invalid',
                timestamp: new Date().toISOString()
              }));

              setResults(prev => [...newResults, ...prev]);
              setLiveJson(data[data.length - 1]);
              
              setCounts(prev => {
                const next = { ...prev };
                newResults.forEach(r => {
                  if (r.status === 'invalid') next.invalid++;
                  else if (r.type.toLowerCase().includes('mobile')) next.mobile++;
                  else next.landline++;
                });
                return next;
              });

              setResults(prevResults => {
                const totalProcessed = prevResults.length;
                setProgress(Math.min(100, Math.round((totalProcessed / lines.length) * 100)));
                return prevResults;
              });
            }
          } catch (e) {
            console.error("Parse error", e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast({ title: "Stopped", description: "Validation process halted by user." });
      } else {
        toast({ variant: 'destructive', title: 'Network Error', description: "Streaming failed or connection lost." });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        fetchAndSyncProfile();
        fetchHistory();
      }, 1000);
    }
  };

  const handleStop = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const userData = JSON.parse(userStr);
    const email = userData.email || (userData.data && userData.data.email) || (userData.user && userData.user.email);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (email) {
      await stopValidation(email);
    }
    
    setIsProcessing(false);
    toast({ variant: "destructive", title: "Stop Signal Sent", description: "Server loop termination requested." });
    setTimeout(fetchAndSyncProfile, 1000);
  };

  const downloadExcel = (data: ValidationResult[], fileName: string) => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No records to export." });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
      Number: item.number,
      Type: item.type,
      Carrier: item.carrier,
      Location: item.location,
      Status: item.status,
      Timestamp: item.timestamp
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const downloadFilteredResults = (type: 'mobile' | 'landline' | 'invalid') => {
    let filtered: ValidationResult[] = [];
    let fileName = "";

    if (type === 'mobile') {
      filtered = results.filter(r => r.type.toLowerCase().includes('mobile') && r.status === 'success');
      fileName = "numcheckr_Mobile_Results";
    } else if (type === 'landline') {
      filtered = results.filter(r => !r.type.toLowerCase().includes('mobile') && r.status === 'success');
      fileName = "numcheckr_Landline_Results";
    } else {
      filtered = results.filter(r => r.status === 'invalid');
      fileName = "numcheckr_Invalid_Results";
    }

    downloadExcel(filtered, fileName);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="tool" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <TabsList className="bg-card/60 border border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="tool" className="rounded-xl font-black italic uppercase text-xs">
              <Zap className="h-4 w-4 mr-2" /> Validation Tool
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black italic uppercase text-xs">
              <HistoryIcon className="h-4 w-4 mr-2" /> Activity History
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary/70">Credits Balance</span>
              <span className="text-2xl font-black italic leading-none">{credits}</span>
            </div>
            <div className="h-8 w-px bg-primary/20" />
            <Button variant="ghost" size="icon" onClick={fetchAndSyncProfile} disabled={isSyncing} className="h-10 w-10 rounded-xl hover:bg-primary/10">
              <RefreshCcw className={cn("h-5 w-5 text-primary", isSyncing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <TabsContent value="tool" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <Card className="border-white/10 bg-card shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
                    Input Numbers
                    {isExtracting && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-primary/30" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Import CSV/XLSX
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv,.txt" />
                  <Textarea 
                    placeholder="Paste numbers here (one per line)..." 
                    value={numberInput} 
                    onChange={e => setNumberInput(e.target.value)} 
                    className="min-h-[300px] font-code text-xs bg-muted/20 border-white/5 focus:border-primary/50" 
                    disabled={isProcessing} 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleStart} disabled={isProcessing} className="h-14 bg-primary font-black italic rounded-xl shadow-lg shadow-primary/20">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />} 
                      {isProcessing ? "CHECKING..." : "START"}
                    </Button>
                    <Button onClick={handleStop} disabled={!isProcessing} variant="destructive" className="h-14 font-black italic rounded-xl shadow-lg shadow-destructive/20">
                      <Square className="h-4 w-4 mr-2" /> STOP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Stream Worker</span>
                </div>
                <ScrollArea className="h-[280px] p-4 font-code text-[10px] text-green-400 bg-black/60">
                  {liveJson ? (
                    <pre className="whitespace-pre-wrap animate-in fade-in">
                      {JSON.stringify(liveJson, null, 2)}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-2">
                      <Code2 className="h-8 w-8" />
                      <span className="italic uppercase font-black text-[10px]">Awaiting Stream...</span>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card 
                  onClick={() => downloadFilteredResults('mobile')}
                  className="border-green-500/20 bg-green-500/5 p-4 rounded-2xl border-2 cursor-pointer hover:bg-green-500/10 transition-all active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Mobile</p>
                    <Download className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-3xl font-black italic">{counts.mobile}</h3>
                </Card>
                <Card 
                  onClick={() => downloadFilteredResults('landline')}
                  className="border-blue-500/20 bg-blue-500/5 p-4 rounded-2xl border-2 cursor-pointer hover:bg-blue-500/10 transition-all active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Landline</p>
                    <Download className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-3xl font-black italic">{counts.landline}</h3>
                </Card>
                <Card 
                  onClick={() => downloadFilteredResults('invalid')}
                  className="border-red-500/20 bg-red-500/5 p-4 rounded-2xl border-2 cursor-pointer hover:bg-red-500/10 transition-all active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Invalid</p>
                    <Download className="h-3 w-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-3xl font-black italic">{counts.invalid}</h3>
                </Card>
              </div>

              <div className="bg-card/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2 px-1">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Validation Progress</span>
                   <span className="text-[10px] font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-primary/10" />
              </div>

              <Card className="bg-card/60 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[9px] font-black">LIVE</Badge>
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Distributed Results</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 rounded-lg text-[10px] font-black uppercase border-primary/30 text-primary"
                    onClick={() => downloadExcel(results, 'numcheckr_Full_Results')}
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-2" /> Export XLSX
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 z-10">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Number</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Carrier</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center opacity-20">
                            <Code2 className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-black italic uppercase">Results will stream here in real-time</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        results.map(res => (
                          <TableRow key={res.id} className="border-white/5 h-16 hover:bg-white/5 transition-all animate-in slide-in-from-left-2">
                            <TableCell className="px-8 font-code font-black text-primary">{res.number}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                res.status === 'invalid' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500', 
                                "border-none text-[9px] font-black uppercase px-3"
                              )}>
                                {res.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-bold italic">{res.carrier}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground">{res.location}</TableCell>
                            <TableCell className="text-right px-8">
                              <Zap className={cn("h-4 w-4 ml-auto", res.status === 'success' ? "text-primary animate-pulse" : "text-muted-foreground")} />
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
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/5">
              <div>
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Activity History</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit trail for all activity</p>
              </div>
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-12 h-12 bg-black/20 border-white/10 rounded-xl font-bold italic" 
                  value={historySearch} 
                  onChange={e => setHistorySearch(e.target.value)} 
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-white/5">
                    <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Time</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                    <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : history.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center opacity-20"><HistoryIcon className="h-12 w-12 mx-auto mb-2" /><p className="font-black italic">No logs found</p></TableCell></TableRow>
                  ) : (
                    history.map((item, i) => (
                      <TableRow key={i} className="border-white/5 h-16 hover:bg-white/5 transition-colors">
                        <TableCell className="px-8 text-xs font-code opacity-60">
                          {item.date ? new Date(item.date).toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3">
                            {item.type || 'WORK'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-bold italic">{item.description}</TableCell>
                        <TableCell className="text-right px-8 text-lg font-black italic text-primary">
                          {item.amount || '0'}
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
    </div>
  );
}
