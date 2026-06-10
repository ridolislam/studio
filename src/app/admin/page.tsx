
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
  AlertTriangle
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
  uploadAdminKeys,
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
    "[SYSTEM] Admin Panel Connected.",
    "[SYSTEM] Waiting for server logs..."
  ]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const ADMIN_SECRET = "Ridol123@";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers()]);
      
      if (statsRes) {
        setStats(statsRes);
      }

      if (usersRes) {
        setUsers(Array.isArray(usersRes) ? usersRes : (usersRes.users || usersRes.data || []));
      }
      
      addLog(`[SYSTEM] Sync completed.`);
    } catch (err) {
      addLog("[ERROR] Failed to connect to admin API.");
      toast({ 
        variant: "destructive", 
        title: "Sync Error", 
        description: "Failed to connect to admin API." 
      });
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput === ADMIN_SECRET) {
      setIsAuthenticated(true);
      fetchData();
      toast({
        title: "Access Granted",
        description: "Welcome to the Master Admin Panel.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid Secret Key. Please try again.",
      });
    }
  };

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
    const newCredits = prompt("Enter new credit amount:", currentCredits.toString());
    if (newCredits === null) return;
    
    setIsUpdating(userId);
    const res = await updateAdminUser({ userId, credits: parseInt(newCredits) });
    if (res && res.success) {
      addLog(`[USER] Updated credits for ${userId} to ${newCredits}`);
      toast({ title: "Updated", description: "Credit Updated Successfully" });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Error", description: res?.message || "Failed to update user." });
    }
    setIsUpdating(null);
  };

  const handleClearKeys = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে সব API Key ডিলিট করতে চান?")) return;

    setIsClearing(true);
    addLog(`[ADMIN] Clearing all API keys from database...`);
    
    try {
      const res = await clearAdminKeys();
      if (res && res.success) {
        addLog(`[SYSTEM] ${res.message}`);
        toast({ title: "Success", description: res.message });
        fetchData();
      } else {
        addLog(`[ERROR] ${res?.message || "Failed to clear keys"}`);
        toast({ variant: "destructive", title: "Error", description: res?.message || "Failed to clear keys" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Connection failed" });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        
        const keys = rows
          .map(r => String(r[0] || '').trim())
          .filter(k => k.length > 15);
        
        if (keys.length === 0) {
          toast({ variant: "destructive", title: "Invalid File", description: "No valid keys found." });
          return;
        }

        addLog(`[SYSTEM] Uploading ${keys.length} API keys...`);
        const res = await uploadAdminKeys({ keys });
        
        if (res && res.success) {
          addLog(`[SYSTEM] Keys uploaded: ${res.message}`);
          toast({ title: "Success", description: res.message });
          fetchData();
        } else {
          toast({ variant: "destructive", title: "Upload Failed", description: res?.message });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to parse Excel file." });
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full"></div>
        <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-3d">Master Access</CardTitle>
            <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground mt-2">
              Unauthorized access is strictly prohibited
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Admin Secret Key</label>
                <div className="relative">
                  <Input 
                    type="password"
                    placeholder="••••••••••••"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    className="h-14 bg-black/40 border-white/10 rounded-xl pl-12 font-black italic"
                    autoFocus
                  />
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black italic text-lg rounded-xl shadow-lg shadow-primary/20 group"
              >
                AUTHORIZE <Unlock className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </form>
          </CardContent>
          <div className="p-6 bg-muted/20 border-t border-white/5 text-center">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
              <ArrowLeft className="h-3 w-3 mr-2" /> Back to Safety
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const usersArray = Array.isArray(users) ? users : [];
  const searchLower = String(search || "").toLowerCase();
  const filteredUsers = usersArray.filter(u => {
    if (!u) return false;
    const email = String(u.email || "").toLowerCase();
    return email.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between bg-card/50 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-sm gap-6">
          <div className="flex items-center gap-4">
            <Logo size={56} />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-foreground uppercase text-3d leading-none">Admin Panel</h1>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Master Terminal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl h-12 border-white/10 hover:bg-white/5 text-xs font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" /> EXIT
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchData} className="h-12 w-12 rounded-xl bg-white/5">
              <RefreshCcw className={loading ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-2 bg-card/60 border border-white/5 p-1 rounded-2xl h-14 md:h-16 mb-8">
            <TabsTrigger value="dashboard" className="rounded-xl font-black italic uppercase text-[10px] md:text-xs h-full data-[state=active]:bg-primary">
              <LayoutDashboard className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-black italic uppercase text-[10px] md:text-xs h-full data-[state=active]:bg-primary">
              <Users className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">User Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-primary/5 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Key size={120} />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-2">Active API Keys</p>
                    <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">{stats?.totalKeys || 0}</h3>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-xl h-10 font-black italic text-[10px] uppercase shadow-lg shadow-destructive/20 border-2 border-white/10"
                    onClick={handleClearKeys}
                    disabled={isClearing}
                  >
                    {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-3 w-3 mr-2" /> CLEAR ALL</>}
                  </Button>
                </div>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 mb-2">Remaining Hits</p>
                <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">{stats?.remainingHits || 0}</h3>
              </Card>
            </div>

            <Card className="border-white/5 bg-card/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
              <h3 className="text-xl font-black italic mb-4">Upload API Keys (Excel)</h3>
              <div className="flex flex-col space-y-4">
                <Input 
                  type="file" 
                  id="excelFile" 
                  onChange={handleExcelUpload} 
                  className="bg-black/20 border-white/10 rounded-xl h-16 py-4 px-6 file:font-black file:italic file:bg-primary file:text-white file:rounded-lg file:border-0 hover:file:bg-primary/90" 
                  accept=".xlsx,.xls" 
                />
                <div className="flex items-center gap-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/70">
                    Select an .xlsx or .xls file containing keys in the first column. Existing keys will be kept.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden">
               <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-2">
                 <Terminal className="h-4 w-4 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Live Server Logs</span>
               </div>
               <div className="p-4 h-40 overflow-y-auto font-code text-[11px] space-y-1 text-green-400">
                 {logs.map((log, i) => (
                   <div key={i}>{log}</div>
                 ))}
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/5">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search database..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 bg-black/20 border-white/10 rounded-2xl font-bold italic"
                  />
                </div>
                <Button onClick={fetchData} className="rounded-xl h-14 bg-primary px-8 font-black italic">
                  REFRESH LIST
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 bg-muted/10 h-16">
                        <TableHead className="px-6 md:px-8 uppercase text-[10px] font-black tracking-[0.2em]">User Email</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-[0.2em]">Credits Balance</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-[0.2em]">Activity</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-[0.2em] text-right px-6 md:px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-64 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                            <p className="font-black italic uppercase text-xs">Fetching Server Data...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.map((user) => (
                        <TableRow key={user._id || user.email} className="border-white/5 hover:bg-white/5 h-20 group transition-colors">
                          <TableCell className="px-6 md:px-8">
                            <span className="font-black italic text-base md:text-lg">{user.email || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-black italic text-lg text-primary">{user.credits ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-bold text-muted-foreground uppercase">{user.history?.length || 0} events</span>
                          </TableCell>
                          <TableCell className="text-right px-6 md:px-8">
                            <Button 
                              className="bg-primary hover:bg-primary/90 rounded-xl h-10 md:h-12 font-black italic px-4 md:px-6 shadow-lg shadow-primary/10 transition-all active:scale-95"
                              disabled={isUpdating === (user._id || user.email)}
                              onClick={() => handleUpdateCredits(user._id || user.email, user.credits || 0)}
                            >
                              {isUpdating === (user._id || user.email) ? <Loader2 className="h-4 w-4 animate-spin" /> : "EDIT"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
