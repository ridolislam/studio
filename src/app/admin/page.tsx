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
  ShieldCheck
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
      }
      if (serverRes && serverRes.success) {
        setServerInfo(serverRes);
        addLog(`[STATS] Active Server: ${serverRes.activeServer === 2 ? 'PV v4' : 'Numverify'}`);
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

  const handleSetServer = async (newServer: number) => {
    if (!confirm(`Switch to Server ${newServer}?`)) return;
    setIsSwitchingServer(true);
    try {
      const res = await setServer({ secret: ADMIN_SECRET, server: newServer });
      if (res.success) {
        toast({ title: "Server Switched", description: res.message });
        await fetchData();
      } else {
        toast({ variant: "destructive", title: "Switch Failed", description: res.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Connection error." });
    } finally {
      setIsSwitchingServer(false);
    }
  };

  const handleClearPVKeys = async () => {
    if (!confirm("WIPE all Phone Validator keys?")) return;
    setIsClearing(true);
    try {
      const res = await clearPhoneValidatorKeys({ secret: ADMIN_SECRET });
      if (res.success) {
        toast({ title: "Success", description: res.message });
        await fetchData();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Wipe failed." });
    } finally {
      setIsClearing(false);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setNewCreditAmount(String(user.credits || 0));
    setIsDialogOpen(true);
  };

  const handleUpdateCredits = async () => {
    if (!editingUser) return;
    const targetUserId = editingUser._id || editingUser.uid || editingUser.id;
    const credits = parseInt(newCreditAmount);
    if (isNaN(credits)) return;

    setIsUpdating(targetUserId);
    try {
      const res = await updateAdminUser({ secret: ADMIN_SECRET, userId: targetUserId, credits });
      if (res.success) {
        toast({ title: "Success", description: "Credits updated." });
        setIsDialogOpen(false);
        await fetchData();
      }
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
        const keys = rows.map(r => String(r[0] || '').trim()).filter(k => k.length > 5);
        
        if (keys.length === 0) return;

        addLog(`[UPLOAD] Sending ${keys.length} keys...`);
        let res;
        if (type === 'rapid') res = await uploadRapidKeys({ secret: ADMIN_SECRET, keys });
        else if (type === 'numverify') res = await uploadNumverifyKeys({ secret: ADMIN_SECRET, keys });
        else res = await uploadPhoneValidatorKeys({ secret: ADMIN_SECRET, keys });
        
        if (res.success) {
          toast({ title: "Keys Injected", description: res.message });
          await fetchData();
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to parse file." });
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl rounded-3xl">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Command Center</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <Input type="password" placeholder="Master Secret" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="h-14 bg-black/40 border-white/10 rounded-xl font-black italic" />
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black italic rounded-xl">AUTHORIZE <Unlock className="ml-2 h-5 w-5" /></Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userList = data?.users || [];
  const filteredUsers = userList.filter((u: any) => String(u?.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between bg-card/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Logo size={56} />
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Admin Terminal</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={loading} className="rounded-xl h-12 w-12">
              <RefreshCcw className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl h-12 font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" /> EXIT
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-primary/5 p-6 rounded-3xl relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Active Server</p>
             <h3 className="text-4xl font-black italic text-primary">{serverInfo?.activeServer === 2 ? "PV V4" : "N-VERIFY"}</h3>
          </Card>
          <Card className="border-accent/20 bg-accent/5 p-6 rounded-3xl relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">PV Keys</p>
             <h3 className="text-4xl font-black italic">{serverInfo?.totalPhoneValidator || 0}</h3>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5 p-6 rounded-3xl relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Remaining Req (PV)</p>
             <h3 className="text-4xl font-black italic">{serverInfo?.remainingRequests || 0}</h3>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5 p-6 rounded-3xl relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Users</p>
             <h3 className="text-4xl font-black italic">{userList.length}</h3>
          </Card>
        </div>

        <Tabs defaultValue="server">
          <TabsList className="bg-card/60 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="server" className="rounded-xl px-8 font-black uppercase italic text-xs">Server Control</TabsTrigger>
            <TabsTrigger value="keys" className="rounded-xl px-8 font-black uppercase italic text-xs">API Keys</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-8 font-black uppercase italic text-xs">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="server" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 border-white/5 bg-card/40 rounded-3xl space-y-6">
                <h4 className="text-xl font-black italic uppercase">Server Orchestration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleSetServer(1)} 
                    disabled={isSwitchingServer || serverInfo?.activeServer === 1}
                    className={cn("h-20 rounded-2xl font-black italic text-lg", serverInfo?.activeServer === 1 ? "bg-primary" : "bg-muted/20 border-2 border-primary/20")}
                  >
                    SERVER 1 (NUMVERIFY)
                  </Button>
                  <Button 
                    onClick={() => handleSetServer(2)} 
                    disabled={isSwitchingServer || serverInfo?.activeServer === 2}
                    className={cn("h-20 rounded-2xl font-black italic text-lg", serverInfo?.activeServer === 2 ? "bg-accent" : "bg-muted/20 border-2 border-accent/20")}
                  >
                    SERVER 2 (PV V4)
                  </Button>
                </div>
              </Card>

              <Card className="p-8 border-white/5 bg-card/40 rounded-3xl space-y-6">
                <h4 className="text-xl font-black italic uppercase">Destructive Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="destructive" onClick={handleClearPVKeys} disabled={isClearing} className="h-20 rounded-2xl font-black italic uppercase">
                    Clear PV Keys
                  </Button>
                  <Button variant="destructive" onClick={async () => { if(confirm("Clear Numverify/Rapid keys?")) await clearAdminKeys({secret: ADMIN_SECRET}); fetchData(); }} className="h-20 rounded-2xl font-black italic uppercase">
                    Clear S1 Keys
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-white/5 bg-card/40 rounded-3xl space-y-4">
              <h4 className="font-black italic uppercase text-xs text-primary">Phone Validator Keys</h4>
              <Input type="file" onChange={(e) => processExcel(e, 'pv')} className="h-12 bg-black/20 border-white/10 rounded-xl" accept=".xlsx,.xls" />
              <p className="text-[9px] font-bold opacity-50 uppercase">Auto-rotates in Server 2. Max 125 req/key.</p>
            </Card>
            <Card className="p-6 border-white/5 bg-card/40 rounded-3xl space-y-4">
              <h4 className="font-black italic uppercase text-xs text-primary">Numverify Keys</h4>
              <Input type="file" onChange={(e) => processExcel(e, 'numverify')} className="h-12 bg-black/20 border-white/10 rounded-xl" accept=".xlsx,.xls" />
              <p className="text-[9px] font-bold opacity-50 uppercase">Standard keys for Server 1.</p>
            </Card>
            <Card className="p-6 border-white/5 bg-card/40 rounded-3xl space-y-4">
              <h4 className="font-black italic uppercase text-xs text-primary">Rapid Proxy Keys</h4>
              <Input type="file" onChange={(e) => processExcel(e, 'rapid')} className="h-12 bg-black/20 border-white/10 rounded-xl" accept=".xlsx,.xls" />
              <p className="text-[9px] font-bold opacity-50 uppercase">Required for proxy rotation in S1.</p>
            </Card>
          </TabsContent>

          <TabsContent value="users">
             <Card className="border-white/5 bg-card/40 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5">
                  <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm bg-black/20 border-white/10 h-12 rounded-xl" />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-8 text-[10px] font-black uppercase">Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Credits</TableHead>
                      <TableHead className="text-right px-8 text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user._id || user.uid} className="border-white/5">
                        <TableCell className="px-8 font-black italic">{user.email}</TableCell>
                        <TableCell className="font-black italic text-primary">{user.credits}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button onClick={() => openEditDialog(user)} className="bg-primary rounded-xl font-black italic h-10 px-6">EDIT</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-primary/20 bg-card rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase">Update Credits</DialogTitle></DialogHeader>
          <div className="py-6"><Input type="number" value={newCreditAmount} onChange={(e) => setNewCreditAmount(e.target.value)} className="h-14 bg-black/40 border-white/10 rounded-xl font-black italic text-xl" /></div>
          <DialogFooter><Button onClick={handleUpdateCredits} disabled={!!isUpdating} className="h-12 bg-primary text-white font-black italic rounded-xl flex items-center gap-2">SAVE CHANGES</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
