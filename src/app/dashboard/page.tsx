
"use client";

import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { Zap, Plus, LogOut, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userProfileRef = user ? doc(db, "users", user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const navigateToCredits = () => {
    console.log("Navigating to credits...");
    router.push("/credits");
  };

  useEffect(() => {
    if (isMounted && !userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, isMounted, router]);

  if (!isMounted || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative group cursor-pointer">
            <Zap className="h-8 w-8 text-primary" />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary italic leading-none">numcheckr</h1>
            <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Validator Pro</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-card border border-primary/20 rounded-2xl px-4 py-2">
            <div className="flex flex-col mr-4">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">Credits</span>
              <span className="text-xl font-code font-black text-primary italic leading-none">
                {profileLoading ? "..." : (profile?.credits || 0)}
              </span>
            </div>
            <Button 
              onClick={navigateToCredits}
              size="icon" 
              className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-2xl border border-white/10 p-0 overflow-hidden">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-2 border-primary/20 bg-card p-2" align="end">
              <DropdownMenuLabel className="pb-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black leading-none">{user.displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                onClick={navigateToCredits}
                className="flex items-center w-full py-2.5 px-3 rounded-xl cursor-pointer group"
              >
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary font-bold">Add Credits</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                className="text-destructive cursor-pointer py-2.5 px-3 rounded-xl flex items-center" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-bold">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <LeadPulseDashboard />
    </main>
  );
}
