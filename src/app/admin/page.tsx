"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Upload, 
  Search, 
  Save, 
  RefreshCcw,
  Loader2,
  Lock,
  ArrowLeft
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
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers()]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (err) {
      toast({ variant: "destructive", title: "Access Denied", description: "Admin authentication failed." });
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between bg-card/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Logo size={48} />
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">Master Admin</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Control Panel</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Exit Admin
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3 bg-card/60 border border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="dashboard" className="rounded-xl font-black italic uppercase text-xs">
              <LayoutDashboard className="h-4 w-4 mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-black italic uppercase text-xs">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="rounded-xl font-black italic uppercase text-xs">
              <Key className="h-4 w-4 mr-2" /> API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-primary/5 p-6 rounded-2xl">
                <p className="text-xs font-black uppercase text-primary/70">Total Users</p>
                <h3 className="text-5xl font-black italic mt-2">{users.length}</h3>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl">
                <p className="text-xs font-black uppercase text-blue-500/70">API Hits</p>
                <h3 className="text-5xl font-black italic mt-2">{stats?.totalHits || 0}</h3>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5 p-6 rounded-2xl">
                <p className="text-xs font-black uppercase text-green-500/70">Total Revenue</p>
                <h3 className="text-5xl font-black italic mt-2">${stats?.revenue?.toFixed(2) || 0}</h3>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-8 space-y-6">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 bg-black/20 border-white/10 rounded-xl"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData}><RefreshCcw className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-muted/10">
                      <TableHead className="py-6 uppercase text-[10px] font-black">User Email</TableHead>
                      <TableHead className="uppercase text-[10px] font-black">Current Credits</TableHead>
                      <TableHead className="uppercase text-[10px] font-black text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.email.includes(search)).map((user) => (
                      <TableRow key={user.email} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold italic">{user.email}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue={user.credits}
                            id={`credits-${user.email}`}
                            className="w-24 h-10 bg-black/20 border-white/10"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 rounded-lg"
                            disabled={isUpdating === user.email}
                            onClick={() => {
                              const input = document.getElementById(`credits-${user.email}`) as HTMLInputElement;
                              handleUpdateCredits(user.email, parseInt(input.value));
                            }}
                          >
                            {isUpdating === user.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apikeys" className="mt-8 space-y-6">
            <Card className="border-dashed border-primary/30 bg-primary/5 p-12 text-center rounded-3xl">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-black italic mb-2">Bulk API Key Upload</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Upload .xlsx or .csv files with "key" column</p>
              <input type="file" id="excelFile" onChange={handleExcelUpload} className="hidden" accept=".xlsx,.csv" />
              <Button onClick={() => document.getElementById('excelFile')?.click()} className="h-14 px-8 bg-primary rounded-xl font-bold italic">
                SELECT EXCEL FILE
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
