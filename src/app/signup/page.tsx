
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Github, Chrome, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password || !name) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all fields to create your account.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Password should be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Auth Profile
      await updateProfile(user, { displayName: name });

      // 3. Create User Profile in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: name,
        credits: 10,
        totalRequests: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Success!",
        description: "Your account has been created. Welcome to numcheckr!",
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      let message = error.message;
      
      if (error.code === 'auth/api-key-not-valid') {
        message = "Firebase API Key is missing or invalid. Please configure src/firebase/config.ts with your actual project keys.";
      }
      
      setAuthError(message);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        credits: 10,
        totalRequests: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });

      router.push("/dashboard");
    } catch (error: any) {
      setAuthError(error.message);
      toast({
        variant: "destructive",
        title: "Google sign in failed",
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
        <Card className="w-full max-w-md border-primary/20 bg-card shadow-2xl transition-all hover:shadow-primary/5">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
               <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 animate-pulse-violet">
                  <Zap className="h-8 w-8 text-primary" />
               </div>
            </div>
            <CardTitle className="text-3xl font-black italic">Create Account</CardTitle>
            <CardDescription>
              Start your free trial today with numcheckr
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {authError && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription className="text-xs">
                  {authError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="rounded-xl font-bold transform transition-all active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button variant="outline" className="rounded-xl font-bold opacity-50 cursor-not-allowed" disabled>
                <Github className="mr-2 h-4 w-4" /> Github
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold">Or sign up with email</span>
              </div>
            </div>
            <form onSubmit={handleSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  className="rounded-xl border-white/10 focus:border-primary/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  className="rounded-xl border-white/10 focus:border-primary/50" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="rounded-xl border-white/10 focus:border-primary/50" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Log In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
