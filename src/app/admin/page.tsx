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
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  getAdminStats, 
  getAdminUsers, 
  updateAdminUser, 
  uploadRapidKeys,
  uploadNumverifyKeys,
  clearAdminKeys
} from "@/app/actions/backend";
import { read, utils } from 'xlsx';
import Logo from "@/components/Logo";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
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
    // Auto-login if secret was already entered in this session
    const savedSecret = sessionStorage.getItem('admin_secret');
    if (savedSecret === ADMIN_SECRET) {
      setIsAuthenticated(true);
      fetchData(savedSecret);
    }
  }, []);

  const fetchData = async (secret: string = ADMIN_SECRET) => {
    setLoading(true);
    addLog(`[SYSTEM] Fetching database stats...`);
    try {
      const [statsRes, usersRes] = await Promise.all([
        getAdminStats(secret), 
        getAdminUsers(secret)
      ]);
      
      if (statsRes && !statsRes.error) {
        setStats(statsRes);
      } else {
        addLog(`[WARN] Stats endpoint returned error: ${statsRes?.message || 'Unknown'}`);
      }

      if (usersRes) {
        const userList = Array.isArray(usersRes) ? usersRes : (usersRes.users || usersRes.data || []);
        setUsers(userList);
      }

      addLog(`[SYSTEM] Central Database Synced successfully.`);
    } catch (err) {
      addLog("[ERROR] Central database connection failed.");
      toast({ variant: "destructive", title: "Sync Error", description: "Could not fetch admin data. Server might be sleeping." });
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
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

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
    const newCredits = prompt("Enter new credit amount:", currentCredits.toString());
    if (newCredits === null) return;
    
    setIsUpdating(userId);
    const res = await updateAdminUser({ secret: ADMIN_SECRET, userId, credits: parseInt(newCredits) });
    if (res && res.success) {
      addLog(`[CREDITS] Set ${userId} balance to ${newCredits}`);
      toast({ title: "Success", description: "User credits updated." });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: res?.message });
    }
    setIsUpdating(null);
  };

  const handleClearKeys = async () => {
    if (!confirm("Are you sure you want to WIPE all API keys?")) return;
    setIsClearing(true);
    try {
      const res = await clearAdminKeys({ secret: ADMIN_SECRET });
      if (res && res.success) {
        addLog(`[WIPE] All keys cleared from database.`);
        toast({ title: "Success", description: res.message });
        fetchData();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Wipe failed." });
    } finally {
      setIsClearing(false);
    }
  };

  const processExcel = (e: React.ChangeEvent<HTMLInputElement>, type: 'rapid' | 'numverify') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        
        const keys = rows.map(r => String(r[0] || '').trim()).filter(k => k.length > 5);
        
        if (keys.length === 0) {
          toast({ variant: "destructive", title: "Empty File", description: "No keys found in column A." });
          return;
        }

        addLog(`[UPLOAD] Sending ${keys.length} ${type} keys...`);
        const res = type === 'rapid' 
          ? await uploadRapidKeys({ secret: ADMIN_SECRET, keys })
          : await uploadNumverifyKeys({ secret: ADMIN_SECRET, keys });
        
        if (res && res.success) {
          addLog(`[SUCCESS] ${type.toUpperCase()} keys active.`);
          toast({ title: "Keys Active", description: res.message });
          fetchData();
        } else {
          toast({ variant: "destructive", title: "Upload Failed", description: res?.message });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Excel parsing failed." });
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Command Center</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Master Secret</label>
                <Input 
                  type="password"
                  placeholder="••••••••••••"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="h-14 bg-black/40 border-white/10 rounded-xl font-black italic"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black italic rounded-xl">
                AUTHORIZE <Unlock className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    String(u?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-card/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Logo size={56} />
            <div className="flex flex-col">
              <h1 className="text-4xl font-black italic tracking-tighter text-3d uppercase">Admin Terminal</h1>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">System Orchestrator</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={loading} className="rounded-xl h-12 w-12">
              <RefreshCcw className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl h-12 font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" /> EXIT
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20 bg-primary/5 p-8 rounded-3xl relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-5"><Database size={120} /></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Permanent RapidKeys</p>
             <h3 className="text-5xl font-black italic">{loading ? "..." : (stats?.rapidCount || 0)}</h3>
          </Card>
          <Card className="border-accent/20 bg-accent/5 p-8 rounded-3xl relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-5"><Zap size={120} /></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-accent/70 mb-2">Temporary NumVerify</p>
             <h3 className="text-5xl font-black italic">{loading ? "..." : (stats?.numverifyCount || 0)}</h3>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5 p-8 rounded-3xl flex items-center justify-between relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-5"><ShieldAlert size={120} /></div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70 mb-2">System Health</p>
               <h3 className="text-5xl font-black italic">{loading ? "BUSY" : "ACTIVE"}</h3>
             </div>
             <Button variant="destructive" size="icon" onClick={handleClearKeys} disabled={isClearing} className="h-14 w-14 rounded-2xl z-10">
               {isClearing ? <Loader2 className="animate-spin" /> : <Trash2 />}
             </Button>
          </Card>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="bg-card/60 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="dashboard" className="rounded-xl px-8 font-black uppercase italic">Tools</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-8 font-black uppercase italic">Users ({filteredUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 border-white/5 bg-card/40 rounded-3xl">
                <h4 className="text-xl font-black italic mb-4">Upload RapidKeys (Threads)</h4>
                <Input type="file" onChange={(e) => processExcel(e, 'rapid')} className="bg-black/20 border-white/10 h-16 rounded-xl py-4" accept=".xlsx,.xls" />
                <p className="text-[9px] mt-4 font-bold uppercase opacity-50">Permanent keys used for concurrency count.</p>
              </Card>
              <Card className="p-8 border-white/5 bg-card/40 rounded-3xl">
                <h4 className="text-xl font-black italic mb-4">Upload Numverify (Temp)</h4>
                <Input type="file" onChange={(e) => processExcel(e, 'numverify')} className="bg-black/20 border-white/10 h-16 rounded-xl py-4" accept=".xlsx,.xls" />
                <p className="text-[9px] mt-4 font-bold uppercase opacity-50">Disposable keys with 100 hit limit.</p>
              </Card>
            </div>

            <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden shadow-xl">
               <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-2">
                 <Terminal className="h-4 w-4 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Master Logs</span>
               </div>
               <div className="p-4 h-64 overflow-y-auto font-code text-[11px] text-green-400 space-y-1 bg-black/80">
                 {logs.length === 0 ? <div>[IDLE] Awaiting connection...</div> : logs.map((log, i) => <div key={i}>{log}</div>)}
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
             <Card className="border-white/5 bg-card/40 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-black/20 border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 py-6 uppercase font-black text-[10px]">Email</TableHead>
                        <TableHead className="uppercase font-black text-[10px]">Credits</TableHead>
                        <TableHead className="text-right px-8 uppercase font-black text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-10 opacity-20 font-bold">NO USERS FOUND</TableCell></TableRow>
                      ) : filteredUsers.map(user => (
                        <TableRow key={user._id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="px-8 font-black italic text-lg">{user.email}</TableCell>
                          <TableCell className="font-black italic text-lg text-primary">{user.credits}</TableCell>
                          <TableCell className="text-right px-8">
                            <Button 
                              onClick={() => handleUpdateCredits(user._id, user.credits)} 
                              className="bg-primary rounded-xl font-black italic h-10 px-6"
                              disabled={isUpdating === user._id}
                            >
                              {isUpdating === user._id ? <Loader2 className="animate-spin" /> : "EDIT"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
