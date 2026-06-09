"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History as HistoryIcon, Search, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUserHistory } from "@/app/actions/backend";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function FullHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push("/login");
      return;
    }
    fetchHistory(JSON.parse(userStr).email);
  }, [router]);

  const fetchHistory = async (email: string) => {
    setLoading(true);
    const res = await getUserHistory({ email });
    if (res.success) {
      setHistory(res.history || []);
      setFiltered(res.history || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const results = history.filter(h => 
      h.description.toLowerCase().includes(search.toLowerCase()) ||
      h.type.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
  }, [search, history]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="rounded-xl border border-white/5">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-black italic">numcheckr</span>
          </div>
        </div>

        <Card className="border-white/5 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/5">
            <div>
              <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">My Activity</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Detailed transaction & validation logs</p>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search history..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 bg-black/20 border-white/10 rounded-2xl font-bold"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-black italic text-xs uppercase opacity-50">Syncing logs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Details</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center opacity-20">
                          <HistoryIcon className="h-12 w-12 mx-auto mb-4" />
                          <p className="font-black italic uppercase">No logs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item, i) => (
                        <TableRow key={i} className="border-white/5 hover:bg-white/5">
                          <TableCell className="py-6 font-code text-xs">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(item.date).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "border-none text-[9px] font-black uppercase px-3",
                              item.type === 'Payment' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                              {item.type === 'Payment' ? 'SUCCESS' : 'WORK'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold italic text-sm">{item.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 text-lg font-black italic">
                              <span className={item.type === 'Payment' ? "text-green-500" : "text-primary"}>
                                {item.amount}
                              </span>
                              <ArrowRight className="h-4 w-4 opacity-20" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
