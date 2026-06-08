
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
      >
        <defs>
          <linearGradient id="nGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="cGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* The 3D effect background block */}
        <rect x="10" y="10" width="80" height="80" rx="20" fill="#1A1A1A" className="opacity-40" />
        
        {/* N character with 3D feel */}
        <path
          d="M25 25V75L45 25V75"
          stroke="url(#nGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />
        
        {/* C character with 3D feel */}
        <path
          d="M75 35C70 28 60 25 55 25C40 25 35 40 35 50C35 60 40 75 55 75C60 75 70 72 75 65"
          stroke="url(#cGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#shadow)"
        />
      </svg>
    </div>
  );
}
