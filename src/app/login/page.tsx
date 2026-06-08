
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ServerCrash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { loginUser } from "@/app/actions/backend";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter email and password.",
      });
      return;
    }

    setIsLoading(true);
    setIsWakingUp(false);
    
    try {
      const result = await loginUser({ email, password });

      if (result.success) {
        // Save user data
        localStorage.setItem('user', JSON.stringify(result.data));
        toast({
          title: "Logged in successfully",
          description: "Welcome back!",
        });
        router.push("/dashboard");
      } else {
        if (result.message.includes('waking up')) {
          setIsWakingUp(true);
        }
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card shadow-2xl relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-bold italic animate-pulse">Connecting to backend...</p>
            </div>
          )}
          
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
               <div className="bg-primary/5 p-4 rounded-3xl border border-primary/20">
                  <Logo size={60} />
               </div>
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Backend Login</CardTitle>
            <CardDescription className="font-medium">
              Access your dashboard at <span className="text-primary">numcheckr.onrender.com</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="grid gap-6">
            {isWakingUp && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <ServerCrash className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/80 leading-relaxed">
                  <p className="font-bold text-amber-500 mb-1">Server Sleep Detected</p>
                  Render free servers sleep after 15 mins of inactivity. It takes about 45s to wake up. Please wait and try again.
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-12 rounded-xl border-white/10 bg-muted/20" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" id="passLabel" className="text-[10px] font-black uppercase tracking-widest opacity-70">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="h-12 rounded-xl border-white/10 bg-muted/20" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-2 text-lg font-black italic bg-primary hover:bg-primary/90 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all"
              >
                {isLoading ? "PLEASE WAIT..." : "SIGN IN TO BACKEND"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
