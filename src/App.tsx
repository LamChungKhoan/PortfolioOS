/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PortfolioTable } from './components/PortfolioTable';
import { BrandSettingsModal } from './components/BrandSettingsModal';
import { useStore } from './store/useStore';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';

export default function App() {
  const brandSettings = useStore(state => state.brandSettings);
  const themeMode = useStore(state => state.themeMode || 'cyber');
  const setThemeMode = useStore(state => state.setThemeMode);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Set default values in case store isn't fully loaded yet
  const prefix = brandSettings?.appNamePrefix || 'Portfolio';
  const suffix = brandSettings?.appNameSuffix || 'OS';
  const logoIcon = brandSettings?.logoIcon || 'LayoutDashboard';
  const themeHue = brandSettings?.themeHue ?? 161;
  const themeSaturation = brandSettings?.themeSaturation || '84%';

  // Update dynamic CSS custom variables on the root document element whenever brand color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-hue', String(themeHue));
    document.documentElement.style.setProperty('--theme-saturation', themeSaturation);

    // Dynamic lightness adjustment for perceptually darker wavelengths (deep blue, purple, dark red/pink)
    let lightnessAdjust = 0;
    if (themeHue >= 210 && themeHue <= 285) {
      // Blue, Indigo, Violet: highly dark to human sight, apply +10% boost
      lightnessAdjust = 10;
    } else if (themeHue >= 190 && themeHue < 210) {
      // Cyan-blue transition: apply +5%
      lightnessAdjust = 5;
    } else if (themeHue > 330 || themeHue <= 18) {
      // Red, Rose, Ruby: moderately dark, apply +6%
      lightnessAdjust = 6;
    }
    document.documentElement.style.setProperty('--theme-lightness-adjust', `${lightnessAdjust}%`);
  }, [themeHue, themeSaturation]);

  // Construct selected Lucide logo icon dynamically
  const SelectedLogoIcon = (Icons as any)[logoIcon] || Icons.LayoutDashboard;

  return (
    <div className={clsx(
      "flex flex-col min-h-screen font-sans antialiased relative overflow-hidden transition-colors duration-300",
      themeMode === 'light' && "bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20",
      themeMode === 'contrast' && "bg-black text-white selection:bg-white/20",
      themeMode === 'cyber' && "bg-[#09090b] text-slate-300 selection:bg-emerald-500/30"
    )}>
      {/* 3D Tech Background Elements - Only in cyber mode */}
      {themeMode === 'cyber' && (
        <>
          <div className="absolute inset-0 tech-grid-bg pointer-events-none z-0"></div>
          <div className="absolute inset-0 scanlines z-50 pointer-events-none opacity-20"></div>
          <div className="scanner-beam pointer-events-none"></div>
          
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 transition-all duration-1000"
            style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 5%, transparent)` }}
          />
          <div 
            className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/4 transition-all duration-1000"
            style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 5%, transparent)` }}
          />
        </>
      )}

      {themeMode === 'light' && (
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      )}

      {/* Main Console Header */}
      <header className={clsx(
        "relative z-20 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors duration-300",
        themeMode === 'light' && "bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm",
        themeMode === 'contrast' && "bg-black border-b border-zinc-800",
        themeMode === 'cyber' && "border-b border-emerald-900/40 glass-panel"
      )}>
        <div className="flex items-center">
          <div className={clsx(
            "w-7 h-7 rounded flex items-center justify-center mr-3 transition-all duration-500",
            themeMode === 'light' && "bg-emerald-600 shadow-sm",
            themeMode === 'contrast' && "bg-white shadow-none",
            themeMode === 'cyber' && "bg-emerald-500 shadow-[0_0_15px_var(--theme-emerald-500)]"
          )}>
            <SelectedLogoIcon className={clsx(
              "w-4 h-4 font-bold",
              themeMode === 'light' ? "text-white" : "text-black"
            )} />
          </div>
          <span 
            className={clsx(
              "font-bold tracking-tight font-display text-xl mt-0.5 select-none",
              themeMode === 'light' && "text-slate-900",
              themeMode === 'contrast' && "text-white",
              themeMode === 'cyber' && "text-white"
            )} 
            style={themeMode === 'cyber' ? { textShadow: `0 0 10px color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 30%, transparent)` } : undefined}
          >
            {prefix}<span className={clsx(
              "transition-colors duration-500",
              themeMode === 'light' ? "text-emerald-600" : "text-emerald-500"
            )}>{suffix}</span>
          </span>
        </div>

        {/* Right Header Toolbar: Theme Switcher & Brand Trigger */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Switcher */}
          <div className={clsx(
            "hidden sm:flex items-center rounded-lg p-1 border",
            themeMode === 'light' ? "bg-slate-100 border-slate-300" : "bg-black/60 border-zinc-800"
          )}>
            <button
              onClick={() => setThemeMode('light')}
              title="Giao diện Sáng (Dễ đọc nhất khi gửi ảnh)"
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                themeMode === 'light' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icons.Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Sáng Báo Cáo</span>
            </button>
            <button
              onClick={() => setThemeMode('contrast')}
              title="Giao diện Tối Tương Phản Cao"
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                themeMode === 'contrast' 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icons.Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Tối Tương Phản</span>
            </button>
            <button
              onClick={() => setThemeMode('cyber')}
              title="Giao diện Cyber Neon Glow"
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                themeMode === 'cyber' 
                  ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cyber Neon</span>
            </button>
          </div>

          {/* Brand Personalization Controls Trigger */}
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer uppercase tracking-wider transition-all",
              themeMode === 'light' 
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                : "text-emerald-400 border border-emerald-900/35 hover:border-emerald-500/50 bg-black/40 hover:bg-emerald-950/25 shadow-[0_0_12px_rgba(16,185,129,0.05)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse-subtle"
            )}
          >
            <Icons.Palette className={clsx("w-3.5 h-3.5", themeMode === 'light' ? "text-slate-700" : "text-emerald-400")} />
            <span>Thương hiệu</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          <PortfolioTable />
        </div>
      </main>

      {/* Personalization settings Modal Panel */}
      <BrandSettingsModal 
        isOpen={isBrandModalOpen} 
        onClose={() => setIsBrandModalOpen(false)} 
      />
    </div>
  );
}
