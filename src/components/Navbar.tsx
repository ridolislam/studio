
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap, Phone, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative bg-card p-2 rounded-lg border border-primary/20 group-hover:scale-110 transition-all duration-300">
             <Zap className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic">numcheckr</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-2" />
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-bold uppercase tracking-widest text-xs">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none rounded-xl">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div className={cn(
        "fixed inset-0 top-16 bg-background z-40 md:hidden transition-all duration-300 ease-in-out transform",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <div className="flex flex-col p-6 space-y-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-black italic border-b border-white/5 pb-4"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-4 pt-4">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl">
                Log In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full h-14 text-lg font-bold bg-primary rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
