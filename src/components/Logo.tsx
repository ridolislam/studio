
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
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <linearGradient id="nGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="cGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          
          {/* 3D Depth Shadow Filter */}
          <filter id="3dShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="3" dy="4" result="offsetblur" />
            <feFlood floodColor="black" floodOpacity="0.5" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Abstract 3D Background Base */}
        <path
          d="M20 10 H80 C85 10 90 15 90 20 V80 C90 85 85 90 80 90 H20 C15 90 10 85 10 80 V20 C10 15 15 10 20 10Z"
          fill="#0F172A"
          className="opacity-50"
        />
        
        {/* The 'N' with 3D feel */}
        <path
          d="M30 30V70L55 30V70"
          stroke="url(#nGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#3dShadow)"
          className="drop-shadow-sm"
        />
        
        {/* The 'C' with 3D Depth and Interlock feel */}
        <path
          d="M80 40C75 32 65 28 58 28C45 28 35 40 35 50C35 60 45 72 58 72C65 72 75 68 80 60"
          stroke="url(#cGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#3dShadow)"
          className="drop-shadow-md"
        />
        
        {/* Subtle Shine/Highlight Overlay */}
        <path
          d="M30 30L42.5 50"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
