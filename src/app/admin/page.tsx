"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Upload, 
  Search, 
  RefreshCcw,
  Loader2,
  Lock,
  ArrowLeft,
  ShieldAlert,
  Unlock,
  Zap,
  Terminal,
  Trash2,
  AlertTriangle,
  Server,
  Database,
  Info,
  Edit,
  Save,
  Activity,
  ShieldCheck,
  Globe,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  getFullDashboardData,
  updateAdminUser, 
  uploadRapidKeys,
  uploadNumverifyKeys,
  clearAdminKeys,
  getServerInfo,
  setServer,
  uploadPhoneValidatorKeys,
  clearPhoneValidatorKeys
} from "@/app/actions/backend";
import { read, utils } from 'xlsx';
import Logo from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCreditAmount, setNewCreditAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Admin Terminal Initialized.",
    "[AUTH] Ready for authorization..."
  ]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const ADMIN_SECRET = "Ridol123@";

  useEffect(() => {
    setIsMounted(true);
    const savedSecret = sessionStorage.getItem('admin_secret');
    if (savedSecret === ADMIN_SECRET) {
      setIsAuthenticated(true);
      fetchData(savedSecret);
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  const fetchData = async (secret: string = ADMIN_SECRET) => {
    setLoading(true);
    addLog(`[SYSTEM] Syncing command center...`);
    try {
      const [dashRes, serverRes] = await Promise.all([
        getFullDashboardData(secret),
        getServerInfo(secret)
      ]);
      
      if (dashRes && dashRes.success) {
        setData(dashRes.data || dashRes);
      } else {
        addLog(`[ERROR] Dashboard data sync failed: ${dashRes.message || 'Unknown error'}`);
      }

      if (serverRes && serverRes.success) {
        setServerInfo(serverRes);
        addLog(`[STATS] Active Engine: Server ${serverRes.activeServer === 2 ? '2 (PV v4)' : '1 (Standard)'}`);
      } else {
        addLog(`[ERROR] Server stats sync failed: ${serverRes.message || 'Unknown error'}`);
      }
    } catch (err) {
      addLog("[ERROR] Critical connection failure. Server might be waking up.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput === ADMIN_SECRET) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_secret', ADMIN_SECRET);
      fetchData(ADMIN_SECRET);
      toast({ title: "Authorized", description: "Welcome to numcheckr Command Center." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid Master Secret." });
    }
  };

  const handleSetServer = async (newServer: number) => {
    if (!confirm(`Switch to Server ${newServer}?`)) return;
    setIsSwitchingServer(true);
    addLog(`[SYSTEM] Switching active engine to Server ${newServer}...`);
    try {
      const res = await setServer({ secret: ADMIN_SECRET, server: newServer });
      if (res.success) {
        toast({ title: "Engine Switched", description: res.message });
        await fetchData();
        addLog(`[SUCCESS] ${res.message}`);
      } else {
        toast({ variant: "destructive", title: "Switch Failed", description: res.message });
        addLog(`[ERROR] ${res.message}`);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Connection error." });
      addLog(`[ERROR] Server communication failure during engine switch.`);
    } finally {
      setIsSwitchingServer(false);
    }
  };

  const handleClearPVKeys = async () => {
    if (!confirm("WIPE all Phone Validator keys? This action is destructive.")) return;
    setIsClearing(true);
    addLog(`[SYSTEM] Initiating PV Key wipe...`);
    try {
      const res = await clearPhoneValidatorKeys({ secret: ADMIN_SECRET });
      if (res.success) {
        toast({ title: "Wipe Success", description: res.message });
        await fetchData();
        addLog(`[SUCCESS] Phone Validator keys cleared.`);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Wipe operation failed." });
    } finally {
      setIsClearing(false);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setNewCreditAmount(String(user.credits || 0));
    setIsDialogOpen(true);
    addLog(`[EDIT] Opening credit control for: ${user.email}`);
  };

  const handleUpdateCredits = async () => {
    if (!editingUser) return;
    const targetUserId = editingUser._id || editingUser.uid || editingUser.id;
    const credits = parseInt(newCreditAmount);
    
    if (isNaN(credits)) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number." });
      return;
    }

    setIsUpdating(targetUserId);
    addLog(`[SYSTEM] Updating credits for ${editingUser.email} to ${credits}...`);
    try {
      const res = await updateAdminUser({ secret: ADMIN_SECRET, userId: targetUserId, credits });
      if (res.success) {
        toast({ title: "Update Success", description: "User credits updated successfully." });
        setIsDialogOpen(false);
        await fetchData();
        addLog(`[SUCCESS] User balance updated.`);
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: res.message });
        addLog(`[ERROR] ${res.message}`);
      }
    } catch(err) {
      addLog(`[ERROR] Failed to send update command to server.`);
    } finally {
      setIsUpdating(null);
    }
  };

  const processExcel = (e: React.ChangeEvent<HTMLInputElement>, type: 'rapid' | 'numverify' | 'pv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataStr = event.target?.result;
        const workbook = read(dataStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const rawKeys = rows.map(r => String(r[0] || '').trim()).filter(k => k.length > 5);
        
        // Remove duplicates on client side for parsing info
        const uniqueKeys = Array.from(new Set(rawKeys));

        if (uniqueKeys.length === 0) {
          toast({ variant: "destructive", title: "No Keys Found", description: "Excel file appears empty or invalid." });
          return;
        }

        addLog(`[UPLOAD] Parsing file... Found ${uniqueKeys.length} unique keys.`);
        
        let res;
        if (type === 'rapid') res = await uploadRapidKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        else if (type === 'numverify') res = await uploadNumverifyKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        else res = await uploadPhoneValidatorKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        
        if (res.success) {
          toast({ title: "Injection Successful", description: res.message });
          await fetchData();
          addLog(`[SUCCESS] ${res.message}`);
        } else {
          toast({ variant: "destructive", title: "Injection Failed", description: res.message });
          addLog(`[ERROR] ${res.message}`);
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Parser Error", description: "Failed to read excel file format." });
      }
    };
    reader.readAsBinaryString(file);
    // Clear input
    e.target.value = '';
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Command Center</CardTitle>
            <CardDescription className="font-bold uppercase text-[10px] tracking-widest opacity-50">Secure Access Restricted</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Master Secret Key</label>
                 <Input type="password" placeholder="••••••••••••" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="h-14 bg-black/40 border-white/10 rounded-xl font-black italic text-center tracking-widest" />
              </div>
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black italic rounded-xl text-lg shadow-lg hover:shadow-primary/20 transition-all">
                AUTHORIZE ACCESS <Unlock className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userList = data?.users || [];
  const filteredUsers = userList.filter((u: any) => String(u?.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-card/50 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center gap-5">
            <Logo size={64} className="drop-shadow-[0_0_20px_rgba(113,85,255,0.3)]" />
            <div className="flex flex-col">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase text-3d leading-none">Admin Terminal</h1>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-2">v4.0.0 Stable Build</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end mr-4">
               <span className="text-[10px] font-black uppercase opacity-50">System Health</span>
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-xs font-black italic uppercase">Connected</span>
               </div>
             </div>
             <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={loading} className="rounded-xl h-14 w-14 border-white/10 hover:bg-primary/5 transition-all">
               <RefreshCcw className={cn("h-6 w-6", loading && "animate-spin")} />
             </Button>
             <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl h-14 font-black italic px-8 border-white/10 hover:bg-destructive/10 hover:text-destructive group transition-all">
               <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" /> EXIT TERMINAL
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Card className="border-primary/20 bg-primary/5 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Server className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Active Core</p>
             <h3 className="text-4xl font-black italic text-primary">{serverInfo?.activeServer === 2 ? "PV v4 Engine" : "Standard V1"}</h3>
          </Card>
          <Card className="border-accent/20 bg-accent/5 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Key className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">PV Capacity</p>
             <h3 className="text-4xl font-black italic">{serverInfo?.totalPhoneValidator || 0} <span className="text-xs opacity-50 uppercase">Keys</span></h3>
          </Card>
          <Card className={cn(
            "p-6 rounded-[1.5rem] relative overflow-hidden group transition-colors",
            (serverInfo?.remainingRequests || 0) < 500 ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"
          )}>
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Remaining Req (PV)</p>
             <h3 className={cn(
               "text-4xl font-black italic",
               (serverInfo?.remainingRequests || 0) < 500 ? "text-amber-500" : "text-emerald-500"
             )}>{serverInfo?.remainingRequests || 0}</h3>
          </Card>
          <Card className="border-white/10 bg-card/60 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Database</p>
             <h3 className="text-4xl font-black italic">{userList.length} <span className="text-xs opacity-50 uppercase">Users</span></h3>
          </Card>
        </div>

        <Tabs defaultValue="server" className="mt-8">
          <TabsList className="bg-card/60 p-1 rounded-2xl h-16 mb-8 w-full md:w-fit border border-white/5">
            <TabsTrigger value="server" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-white">Server Orchestration</TabsTrigger>
            <TabsTrigger value="keys" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-white">API Injection</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-white">User Intelligence</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl px-10 font-black uppercase italic text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-white">Global Events</TabsTrigger>
          </TabsList>

          <TabsContent value="server" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-8 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Activity className="h-5 w-5 text-primary" /></div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter">Active Engine Control</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleSetServer(1)} 
                    disabled={isSwitchingServer || serverInfo?.activeServer === 1}
                    className={cn(
                      "h-24 rounded-2xl font-black italic text-lg transition-all",
                      serverInfo?.activeServer === 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted/10 border-2 border-primary/20 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col items-center">
                       <span>SERVER 1</span>
                       <span className="text-[10px] uppercase font-bold opacity-60">Numverify Core</span>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => handleSetServer(2)} 
                    disabled={isSwitchingServer || serverInfo?.activeServer === 2}
                    className={cn(
                      "h-24 rounded-2xl font-black italic text-lg transition-all",
                      serverInfo?.activeServer === 2 ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-muted/10 border-2 border-accent/20 hover:bg-accent/5"
                    )}
                  >
                    <div className="flex flex-col items-center">
                       <span>SERVER 2</span>
                       <span className="text-[10px] uppercase font-bold opacity-60">Phone Validator v4</span>
                    </div>
                  </Button>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-amber-500/80 uppercase leading-relaxed">
                     Changing the global server will affect all validation tasks immediately. Ensure keys are injected before switching to Server 2.
                   </p>
                </div>
              </Card>

              <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-8 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg"><Trash2 className="h-5 w-5 text-destructive" /></div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter">Destructive Wipe</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="destructive" onClick={handleClearPVKeys} disabled={isClearing} className="h-20 rounded-2xl font-black italic uppercase shadow-lg shadow-destructive/10">
                    Wipe Server 2 Keys
                  </Button>
                  <Button variant="destructive" onClick={async () => { if(confirm("Clear Numverify/Rapid keys?")) await clearAdminKeys({secret: ADMIN_SECRET}); fetchData(); }} className="h-20 rounded-2xl font-black italic uppercase shadow-lg shadow-destructive/10">
                    Wipe Server 1 Keys
                  </Button>
                </div>
                <p className="text-[9px] font-black italic text-center opacity-30 uppercase tracking-widest">Authorized deletion only • Permanent action</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs text-primary tracking-widest">Server 2 (PV) Injection</h4>
                <HardDrive className="h-4 w-4 opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="space-y-4">
                <Input type="file" onChange={(e) => processExcel(e, 'pv')} className="h-14 bg-black/20 border-white/10 rounded-xl cursor-pointer hover:border-primary/50 transition-colors" accept=".xlsx,.xls" />
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase mb-1">Architecture Details</p>
                  <p className="text-[9px] font-bold opacity-60 uppercase leading-relaxed">Parallel rotation supported. Auto-deletion at 125 requests. Excel columns: [Key].</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs text-accent tracking-widest">Numverify Standard Injection</h4>
                <Database className="h-4 w-4 opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="space-y-4">
                <Input type="file" onChange={(e) => processExcel(e, 'numverify')} className="h-14 bg-black/20 border-white/10 rounded-xl cursor-pointer hover:border-accent/50 transition-colors" accept=".xlsx,.xls" />
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                  <p className="text-[10px] font-black text-accent uppercase mb-1">Architecture Details</p>
                  <p className="text-[9px] font-bold opacity-60 uppercase leading-relaxed">Server 1 primary keys. Unlimited lifetime unless deactivated by provider.</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs opacity-50 tracking-widest">Rapid Proxy Injection</h4>
                <Globe className="h-4 w-4 opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="space-y-4">
                <Input type="file" onChange={(e) => processExcel(e, 'rapid')} className="h-14 bg-black/20 border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-colors" accept=".xlsx,.xls" />
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black opacity-50 uppercase mb-1">Architecture Details</p>
                  <p className="text-[9px] font-bold opacity-40 uppercase leading-relaxed">Used for proxy rotation in Server 1 to bypass vendor rate limits.</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
             <Card className="border-white/5 bg-card/40 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
                    <Input placeholder="Search emails or UIDs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 bg-black/40 border-white/10 h-14 rounded-2xl font-black italic" />
                  </div>
                  <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 bg-primary/5 text-primary font-black italic text-xs uppercase">{filteredUsers.length} Users Found</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Identity / Email</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Wallet Balance</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Command</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-40 text-center opacity-20 italic font-black uppercase tracking-widest">No matching users in database</TableCell></TableRow>
                      ) : (
                        filteredUsers.map((user: any) => (
                          <TableRow key={user._id || user.uid} className="h-24 border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="px-8">
                              <div className="flex flex-col">
                                <span className="font-black italic text-lg leading-none">{user.email}</span>
                                <span className="text-[8px] font-bold opacity-30 mt-1 uppercase tracking-widest">UID: {user._id || user.uid}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                 <Zap className="h-4 w-4 text-primary" />
                                 <span className="text-xl font-black italic text-primary">{user.credits || 0}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-3 py-1">Active Account</Badge>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <Button onClick={() => openEditDialog(user)} className="bg-primary hover:bg-primary/90 rounded-xl font-black italic h-12 px-8 text-xs shadow-lg shadow-primary/10 group-hover:scale-105 transition-all">MANAGE</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="border-white/5 bg-black/40 rounded-[2rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                  <Terminal className="h-6 w-6" />
                  <h4 className="text-xl font-black italic uppercase tracking-tighter">Global Event Stream</h4>
                </div>
                <Button variant="ghost" onClick={() => setLogs(["[SYSTEM] Log cleared."])} className="text-[10px] font-black uppercase opacity-50 hover:opacity-100">Clear Logs</Button>
              </div>
              <ScrollArea className="h-[500px] w-full rounded-2xl bg-black/60 border border-white/5 p-6 font-code text-sm">
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className={cn(
                      "flex gap-4 border-l-2 pl-4 py-1",
                      log.includes("[ERROR]") ? "border-red-500 text-red-400" : 
                      log.includes("[SUCCESS]") ? "border-green-500 text-green-400" : 
                      log.includes("[SYSTEM]") ? "border-primary text-primary" : "border-white/10 text-white/60"
                    )}>
                      <span className="shrink-0 font-bold opacity-30 text-[10px] uppercase leading-7">{log.split(']')[0].replace('[', '')}</span>
                      <span className="leading-relaxed">{log.split(']')[1]}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-primary/20 bg-card rounded-[2rem] max-w-md shadow-2xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="p-10 space-y-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Credit Control</DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mt-2">
                Updating balance for <span className="text-primary">{editingUser?.email}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest opacity-50 text-center block w-full">Set New Balance</label>
               <Input 
                 type="number" 
                 value={newCreditAmount} 
                 onChange={(e) => setNewCreditAmount(e.target.value)} 
                 className="h-20 bg-black/40 border-white/10 rounded-2xl font-black italic text-4xl text-center text-primary shadow-inner" 
               />
               <p className="text-[9px] font-bold text-center opacity-30 uppercase">Values reflect immediately in user wallet</p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={handleUpdateCredits} disabled={!!isUpdating} className="w-full h-16 bg-primary text-white font-black italic rounded-2xl text-xl shadow-lg hover:shadow-primary/20 transition-all">
                {isUpdating ? <Loader2 className="animate-spin" /> : "EXECUTE UPDATE"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
