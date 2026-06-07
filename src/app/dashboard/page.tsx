
"use client";

import LeadPulseDashboard from "@/components/LeadPulseDashboard";
import { Zap, Wallet, Plus, User, LogOut, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc } from "@/firebase";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  // Fetch live user profile data (credits, etc.)
  const userProfileRef = user ? doc(db, "users", user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card p-3 rounded-xl border border-primary/20 shadow-2xl transform transition hover:scale-110 duration-500">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter font-headline text-primary italic">numcheckr</h1>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-semibold">Validator Pro</p>
          </div>
        </div>

        {/* User Info & Wallet */}
        <div className="flex items-center gap-4">
          {/* Wallet Section */}
          <div className="flex items-center bg-card border border-primary/20 rounded-2xl px-4 py-2 shadow-inner group transition-all hover:border-primary/50">
            <div className="flex flex-col mr-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wallet Credits</span>
              <span className="text-xl font-code font-black text-primary italic">
                {profileLoading ? "..." : (profile?.credits || 0)}
              </span>
            </div>
            <Link href="/dashboard/credits">
              <Button size="icon" className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 shadow-lg transform transition active:scale-95">
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-2xl border border-white/10 p-0 overflow-hidden hover:border-primary/50 transition-all">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 border-primary/20 bg-card" align="end">
              <DropdownMenuLabel className="font-headline">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="focus:bg-primary/10 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Account Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer text-primary font-bold">
                <Link href="/dashboard/credits">
                  <div className="flex items-center w-full h-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Add Credits</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <LeadPulseDashboard />
    </main>
  );
}
