// src/components/animated-logo.tsx
'use client';

import { cn } from "@/lib/utils";
import './animated-logo.css';

interface AnimatedLogoProps {
    className?: string;
}

export function AnimatedLogo({ className }: AnimatedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={cn("animated-logo-container", className)}
      aria-label="Poultry Mitra Logo"
    >
      <g className="logo-body">
        <path
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
          d="M26.4,24.1c0,6.5-5.3,11.8-11.8,11.8S2.8,30.6,2.8,24.1S8.1,12.3,14.6,12.3S26.4,17.6,26.4,24.1z"
        />
        <path
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
          d="M45.2,24.1c0,6.5-5.3,11.8-11.8,11.8c-5.4,0-10-3.7-11.3-8.6c2.5-1.1,4.2-3.6,4.2-6.5c0-1.7-0.6-3.3-1.6-4.5 C26.2,15.6,29.6,12.3,33.4,12.3C39.9,12.3,45.2,17.6,45.2,24.1z"
        />
      </g>
      <g className="logo-head">
         <circle
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          cx="14.6"
          cy="24.1"
          r="9.8"
        />
        <g className="logo-eye-group">
            <circle className="logo-eye" fill="hsl(var(--foreground))" cx="16.5" cy="21.5" r="1.5" />
            <path className="logo-eyelid" fill="hsl(var(--background))" d="M15,19.5h3c0,1.7-1.3,3-3,3S15,21.2,15,19.5z"/>
        </g>
        <path
          fill="hsl(var(--accent))"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.1,28.6l-6.2,3.3c-0.6,0.3-1.3-0.1-1.3-0.8v-6.6c0-0.7,0.7-1.1,1.3-0.8l6.2,3.3C10.6,27.3,10.6,28.3,10.1,28.6z"
        />
      </g>
    </svg>
  );
}
