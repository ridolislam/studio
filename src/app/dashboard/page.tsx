
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { Zap, LogOut, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userStr));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push("/login");
  };

  if (!isMounted || !user) return null;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-black italic tracking-tighter text-primary">numcheckr</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/credits")} className="rounded-xl font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Add Credits
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 w-12 rounded-2xl border border-white/10 p-0">
                   <div className="bg-primary/10 h-full w-full flex items-center justify-center text-primary font-bold">
                    {user.name?.charAt(0) || <User className="h-6 w-6" />}
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2">
                <DropdownMenuLabel>
                  <p className="font-bold">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <LeadPulseDashboard />
      </div>
    </main>
  );
}
