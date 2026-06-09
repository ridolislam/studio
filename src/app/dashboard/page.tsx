"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { LogOut, Plus, User, Wallet, RefreshCcw, LayoutPanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { syncUserProfile } from "@/app/actions/backend";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push("/login");
    } else {
      const currentUser = JSON.parse(userStr);
      setUser(currentUser);
      syncProfile(currentUser.email);
    }
  }, [router]);

  // Periodic Sync every 60 seconds as requested
  useEffect(() => {
    const interval = setInterval(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        syncProfile(JSON.parse(userStr).email);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Syncs user profile and updates localStorage/UI if credits differ.
   * Matches the provided syncUserCredits logic.
   */
  const syncProfile = async (email: string) => {
    setIsSyncing(true);
    const res = await syncUserProfile(email);
    if (res && res.success) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // Update if server credits differ from local storage
        if (userData.credits !== res.credits) {
          const updatedUser = { ...userData, credits: res.credits };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log("Credits updated from Admin Panel/Server!");
        }
      }
    }
    setIsSyncing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push("/login");
  };

  if (!isMounted || !user) return null;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-card/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <Logo size={48} />
              <h1 className="text-4xl font-black italic tracking-tighter text-foreground text-3d">
                num<span className="text-primary">checkr</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Lead Intelligence System</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-xl border border-primary/20 shadow-inner">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className={isSyncing ? "h-5 w-5 text-primary animate-spin" : "h-5 w-5 text-primary"} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Available Credits</span>
                <span id="creditBalance" className="text-xl font-black italic leading-none">{user.credits || 0}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/credits")}
                className="ml-2 h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-14 px-4 rounded-xl border border-white/5 hover:bg-primary/5 group">
                   <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-primary to-accent h-10 w-10 rounded-lg flex items-center justify-center text-white font-black shadow-lg">
                        {user.name?.charAt(0) || user.email?.charAt(0) || <User className="h-5 w-5" />}
                      </div>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-sm font-black italic">{user.name || "User Account"}</span>
                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-widest border-primary/30 text-primary">Pro Member</Badge>
                      </div>
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mt-2 p-3 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                <DropdownMenuLabel className="px-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <p className="font-black italic text-lg leading-none">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <div className="py-2 space-y-1">
                  <DropdownMenuItem onClick={() => router.push("/credits")} className="rounded-xl cursor-pointer font-bold py-3 hover:bg-primary/10">
                    <Wallet className="mr-3 h-4 w-4 text-primary" /> Billing & Credits
                  </DropdownMenuItem>
                  {user.email === 'admin@numcheckr.com' && (
                    <DropdownMenuItem onClick={() => router.push("/admin")} className="rounded-xl cursor-pointer font-bold py-3 hover:bg-primary/10">
                      <LayoutPanelLeft className="mr-3 h-4 w-4 text-primary" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => syncProfile(user.email)} className="rounded-xl cursor-pointer font-bold py-3 hover:bg-primary/10">
                    <RefreshCcw className="mr-3 h-4 w-4 text-primary" /> Sync Profile
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer font-bold py-3 text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-3 h-4 w-4" /> Log Out
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
