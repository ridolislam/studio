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
  HardDrive,
  Calendar,
  Layers
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
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
  const [pendingServerSwitch, setPendingServerSwitch] = useState<number | null>(null);

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
    addLog(`[SYSTEM] Syncing global orchestrator...`);
    try {
      const [dashRes, serverRes] = await Promise.all([
        getFullDashboardData(secret),
        getServerInfo(secret)
      ]);
      
      if (dashRes && dashRes.success) {
        setData(dashRes.data || dashRes);
      }

      if (serverRes && serverRes.success) {
        setServerInfo(serverRes);
        addLog(`[STATS] Sync Complete: Server ${serverRes.activeServer}`);
      }
    } catch (err) {
      addLog("[ERROR] Critical connection failure.");
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

  const executeServerSwitch = async () => {
    if (pendingServerSwitch === null) return;
    setIsSwitchingServer(true);
    try {
      const res = await setServer({ secret: ADMIN_SECRET, server: pendingServerSwitch });
      if (res.success) {
        toast({ title: "Engine Switched", description: res.message });
        await fetchData();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Connection error." });
    } finally {
      setIsSwitchingServer(false);
      setIsSwitchDialogOpen(false);
      setPendingServerSwitch(null);
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
        const uniqueKeys = Array.from(new Set(rows.map(r => String(r[0] || '').trim()).filter(k => k.length > 5)));

        if (uniqueKeys.length === 0) return;

        let res;
        if (type === 'rapid') res = await uploadRapidKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        else if (type === 'numverify') res = await uploadNumverifyKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        else res = await uploadPhoneValidatorKeys({ secret: ADMIN_SECRET, keys: uniqueKeys });
        
        if (res.success) {
          toast({ title: "Injection Successful", description: res.message });
          await fetchData();
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Parser Error", description: "Failed to read excel file." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleUpdateCredits = async () => {
    if (!editingUser) return;
    const targetUserId = editingUser._id || editingUser.uid || editingUser.id;
    const credits = parseInt(newCreditAmount);
    setIsUpdating(targetUserId);
    try {
      const res = await updateAdminUser({ secret: ADMIN_SECRET, userId: targetUserId, credits });
      if (res.success) {
        toast({ title: "Update Success", description: "User credits updated." });
        setIsDialogOpen(false);
        await fetchData();
      }
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card shadow-2xl rounded-3xl overflow-hidden relative">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase">Command Center</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <Input type="password" placeholder="Master Secret" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="h-14 text-center font-black italic" />
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black italic text-lg rounded-xl">
                AUTHORIZE ACCESS
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
            <Logo size={64} />
            <div className="flex flex-col">
              <h1 className="text-4xl font-black italic uppercase text-3d leading-none">Admin Terminal</h1>
              <span className="text-[10px] font-black uppercase text-primary mt-2 tracking-widest">Global Resource Orchestrator</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={loading} className="rounded-xl h-14 w-14">
               <RefreshCcw className={cn("h-6 w-6", loading && "animate-spin")} />
             </Button>
             <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl h-14 font-black italic px-8">
               EXIT TERMINAL
             </Button>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Card className={cn(
            "p-6 rounded-[1.5rem] relative overflow-hidden group border-2",
            serverInfo?.activeServer === 2 ? "bg-accent/5 border-accent/20" : "bg-primary/5 border-primary/20"
          )}>
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Server className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Current Active Engine</p>
             <h3 className={cn("text-3xl font-black italic uppercase", serverInfo?.activeServer === 2 ? "text-accent" : "text-primary")}>
               {serverInfo?.activeServer === 2 ? "Core 2 (PV v4)" : "Core 1 (Standard)"}
             </h3>
             <Badge variant="outline" className="mt-4 border-white/10 opacity-60 uppercase text-[8px] font-black">
               Last Sync: {new Date().toLocaleTimeString()}
             </Badge>
          </Card>

          <Card className="border-white/10 bg-card/60 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Layers className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Core 1 Capacity</p>
             <div className="space-y-1">
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-bold uppercase opacity-50">Numverify APIs:</span>
                 <span className="text-sm font-black italic text-primary">{serverInfo?.totalNumverify || 0}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-bold uppercase opacity-50">Rapid Proxies:</span>
                 <span className="text-sm font-black italic text-primary">{serverInfo?.totalRapid || 0}</span>
               </div>
             </div>
          </Card>

          <Card className="border-white/10 bg-card/60 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Core 2 Capacity</p>
             <div className="space-y-1">
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-bold uppercase opacity-50">Active PV APIs:</span>
                 <span className="text-sm font-black italic text-accent">{serverInfo?.totalPhoneValidator || 0}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-bold uppercase opacity-50">Remaining Units:</span>
                 <span className={cn("text-sm font-black italic", (serverInfo?.remainingRequests || 0) < 500 ? "text-red-500" : "text-green-500")}>
                   {serverInfo?.remainingRequests || 0}
                 </span>
               </div>
             </div>
          </Card>

          <Card className="border-white/10 bg-card/60 p-6 rounded-[1.5rem] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Calendar className="h-24 w-24" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">System Uptime</p>
             <h3 className="text-xl font-black italic uppercase leading-none mt-2">Operational</h3>
             <p className="text-[9px] font-bold opacity-40 uppercase mt-2">Last switch: {serverInfo?.updatedAt ? new Date(serverInfo.updatedAt).toLocaleDateString() : 'Never'}</p>
          </Card>
        </div>

        {/* Global Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {serverInfo?.activeServer === 2 && serverInfo?.totalPhoneValidator === 0 && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-4 text-destructive animate-pulse">
              <ShieldAlert className="h-6 w-6" />
              <p className="font-black italic uppercase text-xs">CRITICAL: Server 2 active but has 0 keys.</p>
            </div>
          )}
          {serverInfo?.activeServer === 1 && (serverInfo?.totalNumverify === 0 || serverInfo?.totalRapid === 0) && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-4 text-destructive animate-pulse">
              <ShieldAlert className="h-6 w-6" />
              <p className="font-black italic uppercase text-xs">CRITICAL: Server 1 active but keys are missing.</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="server" className="mt-8">
          <TabsList className="bg-card/60 p-1 rounded-2xl h-16 mb-8 w-full md:w-fit border border-white/5">
            <TabsTrigger value="server" className="rounded-xl px-10 font-black uppercase italic text-xs h-full">Global Controls</TabsTrigger>
            <TabsTrigger value="keys" className="rounded-xl px-10 font-black uppercase italic text-xs h-full">API Injection</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-10 font-black uppercase italic text-xs h-full">User Intelligence</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl px-10 font-black uppercase italic text-xs h-full">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="server" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-8 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Activity className="h-5 w-5 text-primary" /></div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter">Global Engine Switch</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => { setPendingServerSwitch(1); setIsSwitchDialogOpen(true); }} 
                  disabled={isSwitchingServer || serverInfo?.activeServer === 1}
                  className={cn("h-24 rounded-2xl font-black italic text-lg", serverInfo?.activeServer === 1 ? "bg-primary" : "bg-muted/10 border border-primary/20")}
                >
                  CORE 1
                </Button>
                <Button 
                  onClick={() => { setPendingServerSwitch(2); setIsSwitchDialogOpen(true); }} 
                  disabled={isSwitchingServer || serverInfo?.activeServer === 2}
                  className={cn("h-24 rounded-2xl font-black italic text-lg", serverInfo?.activeServer === 2 ? "bg-accent" : "bg-muted/10 border border-accent/20")}
                >
                  CORE 2
                </Button>
              </div>
            </Card>

            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-8 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg"><Trash2 className="h-5 w-5 text-destructive" /></div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter">Capacity Wipe</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="destructive" onClick={async () => { if(confirm("Clear PV Keys?")) await clearPhoneValidatorKeys({secret: ADMIN_SECRET}); fetchData(); }} className="h-20 rounded-2xl font-black italic uppercase text-xs">Wipe Core 2</Button>
                <Button variant="destructive" onClick={async () => { if(confirm("Clear Core 1 Keys?")) await clearAdminKeys({secret: ADMIN_SECRET}); fetchData(); }} className="h-20 rounded-2xl font-black italic uppercase text-xs">Wipe Core 1</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs text-accent">Core 2 Injection</h4>
                <Badge className="bg-accent/10 text-accent border-none text-[8px]">{serverInfo?.totalPhoneValidator || 0} Active</Badge>
              </div>
              <Input type="file" onChange={(e) => processExcel(e, 'pv')} className="h-14 bg-black/20 rounded-xl" accept=".xlsx,.xls" />
            </Card>

            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs text-primary">Numverify Injection</h4>
                <Badge className="bg-primary/10 text-primary border-none text-[8px]">{serverInfo?.totalNumverify || 0} Active</Badge>
              </div>
              <Input type="file" onChange={(e) => processExcel(e, 'numverify')} className="h-14 bg-black/20 rounded-xl" accept=".xlsx,.xls" />
            </Card>

            <Card className="p-8 border-white/5 bg-card/40 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
              <div className="flex items-center justify-between">
                <h4 className="font-black italic uppercase text-xs opacity-50">Rapid Proxy Injection</h4>
                <Badge className="bg-white/5 text-white/50 border-none text-[8px]">{serverInfo?.totalRapid || 0} Active</Badge>
              </div>
              <Input type="file" onChange={(e) => processExcel(e, 'rapid')} className="h-14 bg-black/20 rounded-xl" accept=".xlsx,.xls" />
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-white/5 bg-card/40 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80 bg-black/20 rounded-xl h-12" />
                <Badge variant="outline" className="font-black italic">{filteredUsers.length} Members</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-8 font-black uppercase text-[9px]">Identity</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Credits</TableHead>
                    <TableHead className="text-right px-8 font-black uppercase text-[9px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user._id || user.uid} className="h-20 border-white/5">
                      <TableCell className="px-8">
                        <div className="flex flex-col">
                          <span className="font-black italic">{user.email}</span>
                          <span className="text-[8px] opacity-30">UID: {user._id || user.uid}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black italic text-primary">{user.credits || 0}</span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button size="sm" onClick={() => { setEditingUser(user); setNewCreditAmount(String(user.credits || 0)); setIsDialogOpen(true); }} className="font-black italic rounded-xl">MANAGE</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
             <Card className="border-white/5 bg-black/40 rounded-[2rem] p-8 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-black italic uppercase">System Event Stream</h4>
                </div>
                <ScrollArea className="h-[400px] w-full bg-black/40 rounded-xl p-6 border border-white/5">
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <div key={i} className="text-xs font-code opacity-60 border-l-2 border-primary/20 pl-4 py-1">{log}</div>
                    ))}
                  </div>
                </ScrollArea>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isSwitchDialogOpen} onOpenChange={setIsSwitchDialogOpen}>
        <DialogContent className="rounded-[2rem] border-primary/20 bg-card">
          <DialogHeader className="text-center pt-4">
            <DialogTitle className="text-2xl font-black italic uppercase">Confirm Engine Switch</DialogTitle>
            <DialogDescription className="font-bold uppercase text-[10px] tracking-widest mt-2">
              Switching to CORE {pendingServerSwitch} will apply to ALL users immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-6">
            <Button variant="outline" onClick={() => setIsSwitchDialogOpen(false)} className="rounded-xl h-12 px-8 font-black italic">CANCEL</Button>
            <Button onClick={executeServerSwitch} disabled={isSwitchingServer} className="bg-primary rounded-xl h-12 px-8 font-black italic">
              {isSwitchingServer ? <Loader2 className="animate-spin" /> : "CONFIRM SWITCH"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2rem] border-primary/20 bg-card max-w-sm">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-black italic uppercase">Update Wallet</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase opacity-50">{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <Input type="number" value={newCreditAmount} onChange={(e) => setNewCreditAmount(e.target.value)} className="h-16 text-3xl font-black text-center text-primary bg-black/20 rounded-xl border-white/10" />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCredits} disabled={!!isUpdating} className="w-full h-14 bg-primary text-white font-black italic rounded-xl text-lg">
              {isUpdating ? <Loader2 className="animate-spin" /> : "EXECUTE UPDATE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
