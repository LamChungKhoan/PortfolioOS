import React from 'react';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';

export type LogoDisplayMode = 'clean' | 'glass' | 'light';

interface BrandLogoDisplayProps {
  customLogoUrl?: string;
  logoIcon?: string;
  logoStyleMode?: string;
  themeMode?: 'cyber' | 'light' | 'contrast';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogoDisplay({
  customLogoUrl,
  logoIcon = 'LayoutDashboard',
  logoStyleMode = 'clean',
  themeMode = 'cyber',
  size = 'md',
  className,
}: BrandLogoDisplayProps) {
  const SelectedIcon = (Icons as any)[logoIcon] || Icons.LayoutDashboard;

  const sizeClasses = {
    sm: "w-6 h-6 rounded-md",
    md: "w-8 h-8 rounded-lg",
    lg: "w-11 h-11 sm:w-12 sm:h-12 rounded-xl",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-6 h-6",
  };

  // Map any legacy mode string to our 3 streamlined modes
  const normalizedMode: LogoDisplayMode = 
    (logoStyleMode === 'light' || logoStyleMode === 'white-badge' || logoStyleMode === 'framed') ? 'light' :
    (logoStyleMode === 'glass' || logoStyleMode === 'neon-glow') ? 'glass' :
    'clean';

  // 1. IF CUSTOM LOGO IS UPLOADED
  if (customLogoUrl) {
    return (
      <div
        className={clsx(
          "relative flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200 select-none",
          sizeClasses[size],
          
          // Style 1: Clean Seamless (No artificial borders, natural look)
          normalizedMode === 'clean' && (
            themeMode === 'light'
              ? "bg-slate-100/80 border border-slate-200/80 p-0.5"
              : themeMode === 'contrast'
              ? "bg-zinc-900 border border-zinc-800 p-0.5"
              : "bg-black/40 border border-emerald-500/30 p-0.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          ),

          // Style 2: Glass Card (Sophisticated dark glass tile)
          normalizedMode === 'glass' && (
            themeMode === 'light'
              ? "bg-emerald-50/90 border border-emerald-300/80 shadow-sm p-1"
              : themeMode === 'contrast'
              ? "bg-zinc-900 border border-zinc-700 p-1"
              : "bg-[#0b0f0d] border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)] p-1"
          ),

          // Style 3: Light Minimal Badge (Clean crisp white tile for dark logos)
          normalizedMode === 'light' && (
            "bg-white border border-slate-200/90 shadow-sm p-1"
          ),

          className
        )}
      >
        <img
          src={customLogoUrl}
          alt="Brand Logo"
          className="w-full h-full object-contain block"
        />
      </div>
    );
  }

  // 2. DEFAULT BUILT-IN VECTOR ICON (Solid, high-contrast, premium glow)
  return (
    <div
      className={clsx(
        "flex items-center justify-center shrink-0 transition-all duration-300 select-none",
        sizeClasses[size],
        themeMode === 'light' && "bg-emerald-600 text-white shadow-sm",
        themeMode === 'contrast' && "bg-white text-black shadow-none",
        themeMode === 'cyber' && "bg-emerald-500 text-black shadow-[0_0_15px_var(--theme-emerald-500)]",
        className
      )}
    >
      <SelectedIcon className={clsx(iconSizes[size], "font-black stroke-[2.5]")} />
    </div>
  );
}
