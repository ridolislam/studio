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
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getAdminStats, getAdminUsers, updateAdminUser } from "@/app/actions/backend";
import * as XLSX from 'xlsx';
import Logo from "@/components/Logo";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const ADMIN_SECRET = "Ridol123@";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers()]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to fetch admin data." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (email: string, credits: number) => {
    setIsUpdating(email);
    const res = await updateAdminUser({ email, credits });
    if (res.success) {
      toast({ title: "Updated", description: `Credits updated for ${email}` });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to update user." });
    }
    setIsUpdating(null);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target?.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      console.log("Excel Data:", data);
      toast({ title: "File Loaded", description: `Parsed ${data.length} records. Ready for upload.` });
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
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Master Access</CardTitle>
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

  if (loading && users.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-black italic uppercase text-xs tracking-[0.3em] animate-pulse">Establishing Secure Session</p>
    </div>
  );

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
          <TabsList className="grid w-full md:w-[600px] grid-cols-3 bg-card/60 border border-white/5 p-1 rounded-2xl h-14 md:h-16 mb-8">
            <TabsTrigger value="dashboard" className="rounded-xl font-black italic uppercase text-[10px] md:text-xs h-full data-[state=active]:bg-primary">
              <LayoutDashboard className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-black italic uppercase text-[10px] md:text-xs h-full data-[state=active]:bg-primary">
              <Users className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="rounded-xl font-black italic uppercase text-[10px] md:text-xs h-full data-[state=active]:bg-primary">
              <Key className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">API Keys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-primary/5 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-2">Total System Users</p>
                <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">{users.length}</h3>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 mb-2">Server API Hits</p>
                <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">{stats?.totalHits || 0}</h3>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <DollarSign size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/70 mb-2">Estimated Revenue</p>
                <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">${stats?.revenue?.toFixed(2) || 0}</h3>
              </Card>
            </div>
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
                <div className="flex items-center gap-4">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Connected</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 bg-muted/10 h-16">
                        <TableHead className="px-6 md:px-8 uppercase text-[10px] font-black tracking-[0.2em]">User Email</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-[0.2em]">Credits Balance</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-[0.2em] text-right px-6 md:px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map((user) => (
                        <TableRow key={user.email} className="border-white/5 hover:bg-white/5 h-20 group transition-colors">
                          <TableCell className="px-6 md:px-8">
                            <div className="flex flex-col">
                              <span className="font-black italic text-base md:text-lg truncate max-w-[150px] md:max-w-none">{user.email}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">Member since: {new Date().toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="relative w-24 md:w-32">
                              <Input 
                                type="number" 
                                defaultValue={user.credits}
                                id={`credits-${user.email}`}
                                className="h-10 md:h-12 bg-black/20 border-white/10 rounded-xl font-bold italic text-primary"
                              />
                              <Zap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6 md:px-8">
                            <Button 
                              className="bg-primary hover:bg-primary/90 rounded-xl h-10 md:h-12 font-black italic px-4 md:px-6 shadow-lg shadow-primary/10 transition-all active:scale-95"
                              disabled={isUpdating === user.email}
                              onClick={() => {
                                const input = document.getElementById(`credits-${user.email}`) as HTMLInputElement;
                                handleUpdateCredits(user.email, parseInt(input.value));
                              }}
                            >
                              {isUpdating === user.email ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : "SAVE"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-64 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="font-black italic uppercase text-muted-foreground/40">No users found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apikeys" className="mt-8">
            <Card className="border-dashed border-primary/30 bg-primary/5 p-8 md:p-16 text-center rounded-[2rem] md:rounded-[3rem] shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <Upload className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-6 opacity-40 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl md:text-4xl font-black italic mb-4 tracking-tighter">Bulk Key Injection</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest md:tracking-[0.2em] mb-8 md:mb-10 max-w-sm md:max-w-md mx-auto leading-relaxed">
                Upload encrypted Excel datasets (.xlsx) to update the system API pool automatically.
              </p>
              <input type="file" id="excelFile" onChange={handleExcelUpload} className="hidden" accept=".xlsx,.csv" />
              <Button 
                onClick={() => document.getElementById('excelFile')?.click()} 
                className="h-14 md:h-16 px-8 md:px-12 bg-primary hover:bg-primary/90 rounded-2xl font-black italic text-base md:text-lg shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 w-full md:w-auto"
              >
                SELECT EXCEL FILE
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DollarSign({ size = 24, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
