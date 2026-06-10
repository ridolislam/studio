'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  CheckCircle2, 
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
  ArrowRight,
  RefreshCcw,
  Terminal,
  Code2,
  Search
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
import { useRouter } from 'next/navigation';
import { 
  getValidationKey, 
  reportValidationSuccess, 
  reportBadKey, 
  syncUserProfile, 
  getUserHistory 
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
  const [counts, setCounts] = useState({ mobile: 0, landline: 0, invalid: 0, links: 0 });

  const { toast } = useToast();
  const router = useRouter();
  const processingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication and Session Check
  useEffect(() => {
    setIsMounted(true);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // Redirect to login if no session found (as per Next.js routing)
      window.location.href = "/login";
      return;
    }

    fetchAndSyncProfile();
    fetchHistory();

    // Requirement: Sync credits every 60 seconds
    const syncInterval = setInterval(() => {
      fetchAndSyncProfile();
    }, 60000);

    return () => clearInterval(syncInterval);
  }, []);

  const fetchAndSyncProfile = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      const email = user.email || user.data?.email || user.user?.email;
      if (!email) return;

      setIsSyncing(true);
      const res = await syncUserProfile(email);
      if (res && res.success) {
        setCredits(res.credits);
        // Update localStorage to keep it in sync
        const updatedUser = { ...user, credits: res.credits };
        localStorage.setItem('user', JSON.stringify(updatedUser));
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
      const user = JSON.parse(userStr);
      const email = user.email || user.data?.email || user.user?.email;
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
          extracted = rows.flat().map(c => String(c || '').replace(/[\s-()]/g, '')).filter(c => /^\+?[0-9]{7,15}$/.test(c));
        } else {
          extracted = data.toString().split(/\r?\n/).map(l => l.trim().replace(/[\s-()]/g, '')).filter(l => /^\+?[0-9]{7,15}$/.test(l));
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
    const user = JSON.parse(userStr);
    const email = user.email || user.data?.email || user.user?.email;
    if (!email) return;

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);

    for (let i = 0; i < lines.length; i++) {
      if (!processingRef.current) break;

      const number = lines[i];
      let validated = false;
      let attempts = 0;

      while (!validated && attempts < 5 && processingRef.current) {
        try {
          // A. Step 1: Fetch Key
          const keyRes = await getValidationKey(email);
          if (!keyRes || !keyRes.success) {
            toast({ variant: "destructive", title: "Key Error", description: keyRes?.message || "Could not fetch keys." });
            break; 
          }

          const { apiKey, rapidKey } = keyRes;

          // B. Step 2: Direct API Call from browser
          const response = await fetch(
            `https://apilayer-numverify-v1.p.rapidapi.com/validate?number=${number}&access_key=${apiKey}`,
            {
              method: 'GET',
              headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': 'apilayer-numverify-v1.p.rapidapi.com'
              }
            }
          );

          // D. Step 4: Error/Bad Key Reporting (429 or 403)
          if (response.status === 429 || response.status === 403) {
            await reportBadKey({ key: apiKey });
            attempts++;
            // Wait for 2 seconds before retry with next key
            await new Promise(r => setTimeout(r, 2000));
            continue; 
          }

          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

          const data = await response.json();
          
          // C. Step 3: Success Reporting
          // Show raw JSON in feed
          setLiveJson(data);

          // Report success to backend
          const reportRes = await reportValidationSuccess({
            email,
            key: apiKey,
            number,
            result: data // Include full result for backend logging
          });

          if (reportRes && reportRes.success) {
            // Update Credit Balance on UI
            setCredits(reportRes.remainingCredits);
            
            // Add to main table
            const newRes: ValidationResult = {
              id: Math.random().toString(36).substr(2, 9),
              number: data.number || number,
              type: data.line_type || (data.valid ? 'Valid' : 'Invalid'),
              carrier: data.carrier || 'N/A',
              location: data.location || 'N/A',
              status: data.valid ? 'success' : 'invalid',
              timestamp: new Date().toISOString()
            };
            setResults(prev => [newRes, ...prev]);
            
            // Update counts
            const ltype = String(data.line_type || '').toLowerCase();
            if (!data.valid) setCounts(p => ({ ...p, invalid: p.invalid + 1 }));
            else if (ltype.includes('mobile')) setCounts(p => ({ ...p, mobile: p.mobile + 1 }));
            else setCounts(p => ({ ...p, landline: p.landline + 1 }));

            validated = true;
          } else {
            toast({ variant: 'destructive', title: 'Process Halted', description: reportRes.message || "Session error." });
            processingRef.current = false;
            break;
          }
        } catch (error) {
          console.error('Process error:', error);
          attempts++;
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      setProgress(Math.round(((i + 1) / lines.length) * 100));

      // Requirement: 1.5-second delay between successful validations
      if (validated && i < lines.length - 1 && processingRef.current) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setIsProcessing(false);
    processingRef.current = false;
    fetchHistory();
  };

  const handleStop = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  const filteredHistory = history.filter(item => {
    if (!item) return false;
    const s = historySearch.toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    return desc.includes(s) || type.includes(s);
  });

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
              <span className="text-[10px] font-black uppercase text-primary/70">Balance</span>
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
                    Input Leads
                    {isExtracting && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-primary/30" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Upload CSV/XLSX
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv,.txt" />
                  <Textarea 
                    placeholder="Enter numbers..." 
                    value={numberInput} 
                    onChange={e => setNumberInput(e.target.value)} 
                    className="min-h-[300px] font-code text-xs bg-muted/20 border-white/5" 
                    disabled={isProcessing} 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleStart} disabled={isProcessing} className="h-14 bg-primary font-black italic rounded-xl">
                      <Play className="h-4 w-4 mr-2" /> START
                    </Button>
                    <Button onClick={handleStop} disabled={!isProcessing} variant="outline" className="h-14 border-destructive/30 text-destructive font-black italic rounded-xl">
                      <Square className="h-4 w-4 mr-2" /> STOP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Requirement: Live API Response formatted box */}
              <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase">Live API Response</span>
                </div>
                <ScrollArea className="h-[250px] p-4 font-code text-[10px] text-green-400">
                  {liveJson ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(liveJson, null, 2)}</pre>
                  ) : (
                    <span className="opacity-20 italic">Waiting for real-time validation data...</span>
                  )}
                </ScrollArea>
              </Card>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-green-500/20 bg-green-500/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-green-500">Mobile</p>
                  <h3 className="text-3xl font-black italic">{counts.mobile}</h3>
                </Card>
                <Card className="border-blue-500/20 bg-blue-500/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-blue-500">Landline</p>
                  <h3 className="text-3xl font-black italic">{counts.landline}</h3>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-red-500">Invalid</p>
                  <h3 className="text-3xl font-black italic">{counts.invalid}</h3>
                </Card>
                <Card className="border-primary/20 bg-primary/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-primary">Progress</p>
                  <h3 className="text-3xl font-black italic">{progress}%</h3>
                </Card>
              </div>

              <div className="bg-card/40 p-4 rounded-2xl border border-white/5 space-y-2">
                <Progress value={progress} className="h-2 bg-primary/20" />
              </div>

              <Card className="bg-card border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 text-[10px] font-black uppercase">Number</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Carrier</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Location</TableHead>
                      <TableHead className="text-right px-8 text-[10px] font-black uppercase">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center opacity-20">
                          <Code2 className="h-12 w-12 mx-auto mb-4" />
                          <p className="font-black italic uppercase">Waiting for process start</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      results.map(res => (
                        <TableRow key={res.id} className="border-white/5 h-16 group hover:bg-white/5 transition-colors">
                          <TableCell className="px-8 font-code font-black text-primary">{res.number}</TableCell>
                          <TableCell>
                            <Badge className={cn(res.status === 'invalid' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500', "border-none text-[9px] font-black uppercase px-3")}>
                              {res.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold italic">{res.carrier}</TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">{res.location}</TableCell>
                          <TableCell className="text-right px-8 font-code text-[10px] opacity-40">
                            {new Date(res.timestamp).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Activity Logs</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Full transaction & validation history</p>
              </div>
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter logs by description or type..." 
                  className="pl-12 h-12 bg-black/20 border-white/10 rounded-xl font-bold" 
                  value={historySearch} 
                  onChange={e => setHistorySearch(e.target.value)} 
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-white/5">
                    <TableHead className="px-8 py-6 text-[10px] font-black uppercase">Timestamp</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Details</TableHead>
                    <TableHead className="text-right px-8 text-[10px] font-black uppercase">Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center opacity-20"><HistoryIcon className="h-12 w-12 mx-auto mb-2" /><p className="font-black italic">No history found</p></TableCell></TableRow>
                  ) : (
                    filteredHistory.map((item, i) => (
                      <TableRow key={i} className="border-white/5 h-16 hover:bg-white/5">
                        <TableCell className="px-8 text-xs font-code">{item.date ? new Date(item.date).toLocaleString() : "N/A"}</TableCell>
                        <TableCell><Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3">{item.type || 'WORK'}</Badge></TableCell>
                        <TableCell className="text-sm font-bold italic">{item.description}</TableCell>
                        <TableCell className="text-right px-8 text-lg font-black italic text-primary">{item.amount || '0'}</TableCell>
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
