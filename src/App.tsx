/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PortfolioTable } from './components/PortfolioTable';
import { BrandSettingsModal } from './components/BrandSettingsModal';
import { BrandLogoDisplay } from './components/BrandLogoDisplay';
import { ReadOnlyPortfolioView } from './components/ReadOnlyPortfolioView';
import { decodePortfolioFromUrl, SharedPortfolioPayload } from './utils/shareUtils';
import { subscribeToCloudPortfolio, fetchPortfolioFromCloud, cleanRoomSlug } from './lib/portfolioCloudService';
import { useStore } from './store/useStore';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';

export default function App() {
  const [readOnlyPayload, setReadOnlyPayload] = useState<SharedPortfolioPayload | null>(null);
  const [cloudRoomId, setCloudRoomId] = useState<string | null>(null);
  const [isLoadingCloudRoom, setIsLoadingCloudRoom] = useState(false);
  const [cloudRoomError, setCloudRoomError] = useState<string | null>(null);

  // Check URL params (?room=slug) or URL hash (#share=...) on mount & url changes
  useEffect(() => {
    const parseUrl = async () => {
      const search = window.location.search;
      const hash = window.location.hash;
      const params = new URLSearchParams(search);
      const roomParam = params.get('room') || params.get('portfolio');

      // 1. If Cloud Room ID provided (e.g. ?room=vinh-quang)
      if (roomParam) {
        const cleanSlug = cleanRoomSlug(roomParam);
        setCloudRoomId(cleanSlug);
        setIsLoadingCloudRoom(true);
        setCloudRoomError(null);

        // Fetch initial data
        let initialData = await fetchPortfolioFromCloud(cleanSlug);
        
        // Quick retry once in case it's currently saving
        if (!initialData) {
          await new Promise(r => setTimeout(r, 1000));
          initialData = await fetchPortfolioFromCloud(cleanSlug);
        }

        if (initialData) {
          setReadOnlyPayload({
            v: 1,
            title: initialData.title,
            positions: initialData.positions,
            cashBalance: initialData.cashBalance,
            marketPrices: initialData.marketPrices,
            brandSettings: initialData.brandSettings,
            portfolioStockWeight: initialData.portfolioStockWeight,
            themeMode: initialData.themeMode,
            brokerNotes: initialData.brokerNotes,
            createdDate: new Date().toLocaleDateString('vi-VN'),
          });
          setIsLoadingCloudRoom(false);
        } else {
          // If still not found after retry, set timer for error display
          setTimeout(() => {
            setIsLoadingCloudRoom(prev => {
              if (prev) {
                setCloudRoomError(`Không tìm thấy danh mục cho mã phòng "${roomParam}". Vui lòng kiểm tra lại đường link từ Môi giới hoặc bấm "LƯU LÊN CLOUD" trên máy Môi giới.`);
                return false;
              }
              return false;
            });
          }, 1500);
        }

        // Subscribe to real-time updates from broker
        const unsub = subscribeToCloudPortfolio(cleanSlug, (data) => {
          if (data) {
            setReadOnlyPayload({
              v: 1,
              title: data.title,
              positions: data.positions,
              cashBalance: data.cashBalance,
              marketPrices: data.marketPrices,
              brandSettings: data.brandSettings,
              portfolioStockWeight: data.portfolioStockWeight,
              themeMode: data.themeMode,
              brokerNotes: data.brokerNotes,
              createdDate: new Date().toLocaleDateString('vi-VN'),
            });
            setIsLoadingCloudRoom(false);
            setCloudRoomError(null);
          }
        });

        return () => unsub();
      }

      // 2. Fallback to hash token if available
      let shareToken = '';
      if (hash.includes('share=')) {
        shareToken = hash.split('share=')[1]?.split('&')[0] || '';
      }

      if (shareToken) {
        const decoded = decodePortfolioFromUrl(shareToken);
        if (decoded) {
          setReadOnlyPayload(decoded);
          return;
        }
      }

      setReadOnlyPayload(null);
      setCloudRoomId(null);
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    window.addEventListener('popstate', parseUrl);
    return () => {
      window.removeEventListener('hashchange', parseUrl);
      window.removeEventListener('popstate', parseUrl);
    };
  }, []);

  const handleExitReadOnly = () => {
    window.history.pushState({}, '', window.location.pathname);
    setReadOnlyPayload(null);
    setCloudRoomId(null);
  };

  const brandSettings = useStore(state => state.brandSettings);
  const themeMode = useStore(state => state.themeMode || 'cyber');
  const setThemeMode = useStore(state => state.setThemeMode);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Set default values in case store isn't fully loaded yet
  const prefix = brandSettings?.appNamePrefix || 'Portfolio';
  const suffix = brandSettings?.appNameSuffix || 'OS';
  const logoIcon = brandSettings?.logoIcon || 'LayoutDashboard';
  const customLogoUrl = brandSettings?.customLogoUrl;
  const logoStyleMode = brandSettings?.logoStyleMode || 'clean';
  const themeHue = brandSettings?.themeHue ?? 161;
  const themeSaturation = brandSettings?.themeSaturation || '84%';

  // Update dynamic CSS custom variables on the root document element whenever brand color changes
  useEffect(() => {
    const activeHue = readOnlyPayload?.brandSettings?.themeHue ?? themeHue;
    const activeSat = readOnlyPayload?.brandSettings?.themeSaturation ?? themeSaturation;

    document.documentElement.style.setProperty('--theme-hue', String(activeHue));
    document.documentElement.style.setProperty('--theme-saturation', activeSat);

    let lightnessAdjust = 0;
    if (activeHue >= 210 && activeHue <= 285) {
      lightnessAdjust = 10;
    } else if (activeHue >= 190 && activeHue < 210) {
      lightnessAdjust = 5;
    } else if (activeHue > 330 || activeHue <= 18) {
      lightnessAdjust = 6;
    }
    document.documentElement.style.setProperty('--theme-lightness-adjust', `${lightnessAdjust}%`);
  }, [themeHue, themeSaturation, readOnlyPayload]);

  // Loading state when opening cloud room link
  if (isLoadingCloudRoom) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-4 p-4">
        <Icons.Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <div className="text-sm font-mono text-emerald-300">
          Đang kết nối danh mục trực tiếp từ Môi Giới ({cloudRoomId})...
        </div>
      </div>
    );
  }

  // Error state if cloud room does not exist
  if (cloudRoomError && !readOnlyPayload) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-4 p-4 text-center">
        <Icons.ShieldAlert className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-zinc-100 font-display">KHÔNG TÌM THẤY PHÒNG DANH MỤC</h2>
        <p className="text-sm text-zinc-400 max-w-md">{cloudRoomError}</p>
        <button
          onClick={handleExitReadOnly}
          className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
        >
          Về Trang Chủ PortfolioOS
        </button>
      </div>
    );
  }

  // If in Shared Client Read-Only Mode, render client view directly
  if (readOnlyPayload) {
    return (
      <ReadOnlyPortfolioView
        data={readOnlyPayload}
        onExitReadOnly={handleExitReadOnly}
      />
    );
  }

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
        <div 
          onClick={() => setIsBrandModalOpen(true)}
          title="Nhấp để tùy chỉnh Thương hiệu & Logo riêng"
          className="flex items-center group cursor-pointer"
        >
          <div className="mr-3 transition-transform group-hover:scale-105">
            <BrandLogoDisplay
              customLogoUrl={customLogoUrl}
              logoIcon={logoIcon}
              logoStyleMode={logoStyleMode}
              themeMode={themeMode}
              size="md"
            />
          </div>
          <span 
            className={clsx(
              "font-bold tracking-tight font-display text-xl mt-0.5 select-none transition-colors",
              themeMode === 'light' && "text-slate-900 group-hover:text-emerald-700",
              themeMode === 'contrast' && "text-white group-hover:text-zinc-200",
              themeMode === 'cyber' && "text-white group-hover:text-emerald-300"
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
