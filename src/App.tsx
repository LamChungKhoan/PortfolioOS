/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PortfolioTable } from './components/PortfolioTable';
import { BrandSettingsModal } from './components/BrandSettingsModal';
import { useStore } from './store/useStore';
import * as Icons from 'lucide-react';

export default function App() {
  const brandSettings = useStore(state => state.brandSettings);
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
    <div className="flex flex-col min-h-screen bg-[#09090b] text-slate-300 font-sans antialiased relative overflow-hidden">
      {/* 3D Tech Background Elements */}
      <div className="absolute inset-0 tech-grid-bg pointer-events-none z-0"></div>
      <div className="absolute inset-0 scanlines z-50 pointer-events-none opacity-20"></div>
      <div className="scanner-beam pointer-events-none"></div>
      
      {/* Gradient ambient glow that shifts beautifully with the brand color theme */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 transition-all duration-1000"
        style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 5%, transparent)` }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/4 transition-all duration-1000"
        style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 5%, transparent)` }}
      />

      {/* Main Console Header */}
      <header className="relative z-10 h-14 border-b border-emerald-900/40 glass-panel px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center mr-3 shadow-[0_0_15px_var(--theme-emerald-500)] transition-all duration-500">
            <SelectedLogoIcon className="w-4 h-4 text-black font-bold" />
          </div>
          <span 
            className="font-bold tracking-tight font-display text-white text-xl mt-0.5 select-none" 
            style={{ textShadow: `0 0 10px color-mix(in srgb, hsl(${themeHue} ${themeSaturation} 44%) 30%, transparent)` }}
          >
            {prefix}<span className="text-emerald-500 transition-colors duration-500">{suffix}</span>
          </span>
        </div>

        {/* Brand Personalization Controls Trigger */}
        <button
          onClick={() => setIsBrandModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-emerald-400 border border-emerald-900/35 hover:border-emerald-500/50 bg-black/40 hover:bg-emerald-950/25 cursor-pointer uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.05)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all animate-pulse-subtle"
        >
          <Icons.Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span>Thương hiệu</span>
        </button>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 selection:bg-emerald-500/30 relative z-10">
        <div className="max-w-[1600px] mx-auto perspective-1000">
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
