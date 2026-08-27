import React, { useState, useEffect } from 'react';
import { SharedPortfolioPayload } from '../utils/shareUtils';
import { BrandSettings } from '../store/useStore';
import { BrandLogoDisplay } from './BrandLogoDisplay';
import { AllocationModal } from './AllocationModal';
import { ReadOnlyStockDetailModal } from './ReadOnlyStockDetailModal';
import { Card, Button } from './ui/core';
import { clsx } from 'clsx';
import { 
  Activity, 
  RefreshCw, 
  PieChart, 
  ArrowUpDown, 
  ShieldCheck, 
  Smartphone, 
  Monitor,
  LayoutDashboard,
  Star,
  Sun,
  Moon,
  Sparkles,
  MessageSquareQuote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReadOnlyPortfolioViewProps {
  data: SharedPortfolioPayload;
  onExitReadOnly?: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

const formatStockPrice = (val: number) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const getTagStyles = (tag: string, isLight: boolean) => {
  const t = tag.toLowerCase().trim();
  if (isLight) {
    if (t.includes('ngân hàng') || t.includes('vcb') || t.includes('acb')) {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    }
    if (t.includes('thép') || t.includes('hpg')) {
      return 'bg-slate-200 border-slate-400 text-slate-800';
    }
    if (t.includes('bất động sản') || t.includes('bđs')) {
      return 'bg-amber-100 border-amber-300 text-amber-900';
    }
    if (t.includes('công nghệ') || t.includes('fpt')) {
      return 'bg-cyan-100 border-cyan-300 text-cyan-900';
    }
    if (t.includes('chứng khoán') || t.includes('vnd') || t.includes('ssi')) {
      return 'bg-blue-100 border-blue-300 text-blue-900';
    }
    return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  }

  if (t.includes('ngân hàng') || t.includes('vcb') || t.includes('acb')) {
    return 'bg-violet-950/45 border-violet-500/40 text-violet-350';
  }
  if (t.includes('thép') || t.includes('hpg')) {
    return 'bg-slate-900/50 border-slate-400/40 text-slate-350';
  }
  if (t.includes('bất động sản') || t.includes('bđs')) {
    return 'bg-amber-950/45 border-amber-500/40 text-amber-350';
  }
  if (t.includes('công nghệ') || t.includes('fpt')) {
    return 'bg-cyan-950/45 border-cyan-500/40 text-cyan-350';
  }
  if (t.includes('chứng khoán') || t.includes('vnd') || t.includes('ssi')) {
    return 'bg-blue-950/45 border-blue-500/40 text-blue-350';
  }
  if (t.includes('dài hạn') || t.includes('đầu tư dài hạn')) {
    return 'bg-emerald-950/45 border-emerald-500/40 text-emerald-350';
  }
  if (t.includes('lướt sóng') || t.includes('t+')) {
    return 'bg-rose-950/45 border-rose-500/40 text-rose-350';
  }
  if (t.includes('tích sản')) {
    return 'bg-yellow-950/45 border-yellow-500/40 text-yellow-350';
  }
  if (t.includes('trung hạn')) {
    return 'bg-indigo-950/45 border-indigo-500/40 text-indigo-350';
  }
  return 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400';
};

export function ReadOnlyPortfolioView({ data, onExitReadOnly }: ReadOnlyPortfolioViewProps) {
  const [positions, setPositions] = useState(data.positions || []);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(data.marketPrices || {});
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('vi-VN'));
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [sortOrder, setSortOrder] = useState<'none' | 'desc' | 'asc'>('none');
  const [densityMode, setDensityMode] = useState<'standard' | 'compact'>('standard');
  const [activeTheme, setActiveTheme] = useState<'cyber' | 'light' | 'contrast'>(data.themeMode || 'cyber');
  const [selectedDashboardPosition, setSelectedDashboardPosition] = useState<any | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const brand: BrandSettings = data.brandSettings || {
    appNamePrefix: 'Portfolio',
    appNameSuffix: 'OS',
    logoIcon: 'LayoutDashboard',
    themeHue: 161,
    themeSaturation: '84%',
    themeName: 'emerald',
    logoStyleMode: 'original'
  };

  const isLight = activeTheme === 'light';
  const isContrast = activeTheme === 'contrast';
  const isCyber = activeTheme === 'cyber';
  const isCompact = densityMode === 'compact';

  const themeHue = brand.themeHue ?? 161;
  const isRedTheme = themeHue > 330 || themeHue <= 18;

  // Sync brand CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-hue', String(themeHue));
    document.documentElement.style.setProperty('--theme-saturation', brand.themeSaturation || '84%');
  }, [themeHue, brand.themeSaturation]);

  // Derived calculation exactly identical to useDerivedPortfolio
  const enrichedPositions = positions.map(pos => {
    const totalVolume = pos.buys.reduce((sum, b) => sum + (b.volume || 0), 0);
    const totalCost = pos.buys.reduce((sum, b) => sum + ((b.price || 0) * (b.volume || 0) * 1000), 0);
    const averageCost = totalVolume > 0 ? pos.buys.reduce((sum, b) => sum + ((b.price || 0) * (b.volume || 0)), 0) / totalVolume : 0;
    
    const currentPrice = marketPrices[pos.symbol] !== undefined ? marketPrices[pos.symbol] : averageCost;
    const marketValue = totalVolume * currentPrice * 1000;
    const unrealizedPL = marketValue - totalCost;
    const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

    return {
      ...pos,
      totalVolume,
      totalCost,
      averageCost,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent
    };
  });

  const totalWeight = positions.reduce((sum, p) => sum + (p.allocationWeight !== undefined ? p.allocationWeight : 0), 0);
  const finalPositions = enrichedPositions.map(pos => {
    let weightPercent = 0;
    if (totalWeight > 0) {
      weightPercent = ((pos.allocationWeight !== undefined ? pos.allocationWeight : 0) / totalWeight) * 100;
    } else if (positions.length > 0) {
      weightPercent = 100 / positions.length;
    }
    return {
      ...pos,
      weightPercent
    };
  });

  let portfolioPLPercent = 0;
  finalPositions.forEach(p => {
    portfolioPLPercent += (p.weightPercent / 100) * p.unrealizedPLPercent;
  });

  const portfolioStockWeight = data.portfolioStockWeight ?? 70;

  // Realtime Live Price Fetch
  const fetchLivePrices = async () => {
    const symbols = Array.from(new Set(positions.map(p => p.symbol).filter(Boolean)));
    if (symbols.length === 0) return;

    setIsFetchingPrices(true);
    try {
      const res = await fetch(`https://finance.vietstock.vn/data/stockprice/${symbols.join(',')}`);
      if (res.ok) {
        const json = await res.json();
        const newPrices: Record<string, number> = { ...marketPrices };
        if (Array.isArray(json)) {
          json.forEach(item => {
            if (item.StockCode && item.MatchPrice) {
              newPrices[item.StockCode.toUpperCase()] = Number(item.MatchPrice) / 1000;
            }
          });
        }
        setMarketPrices(newPrices);
      }
    } catch (e) {
      console.log('Live price check completed');
    } finally {
      setIsFetchingPrices(false);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    }
  };

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const allTags = Array.from(new Set(positions.flatMap(p => p.tags || [])));
  const filteredPositions = selectedTag === 'Tất cả'
    ? finalPositions
    : finalPositions.filter(p => p.tags?.includes(selectedTag));

  const displayPositions = [...filteredPositions];
  if (sortOrder === 'desc') {
    displayPositions.sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent);
  } else if (sortOrder === 'asc') {
    displayPositions.sort((a, b) => a.unrealizedPLPercent - b.unrealizedPLPercent);
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  const maxBuys = Math.max(1, ...positions.map(p => p.buys.length));
  const boardTitle = data.title || 'DANH MỤC ĐẦU TƯ';

  return (
    <div className={clsx(
      "flex flex-col min-h-screen font-sans antialiased relative overflow-hidden transition-colors duration-300",
      isLight && "bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20",
      isContrast && "bg-black text-white selection:bg-white/20",
      isCyber && "bg-[#09090b] text-slate-300 selection:bg-emerald-500/30"
    )}>
      {/* 3D Tech Background Elements - Cyber Mode */}
      {isCyber && (
        <>
          <div className="absolute inset-0 tech-grid-bg pointer-events-none z-0"></div>
          <div className="absolute inset-0 scanlines z-50 pointer-events-none opacity-20"></div>
          <div className="scanner-beam pointer-events-none"></div>
          
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 transition-all duration-1000"
            style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${brand.themeSaturation || '84%'} 44%) 5%, transparent)` }}
          />
          <div 
            className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/4 transition-all duration-1000"
            style={{ backgroundColor: `color-mix(in srgb, hsl(${themeHue} ${brand.themeSaturation || '84%'} 44%) 5%, transparent)` }}
          />
        </>
      )}

      {isLight && (
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      )}

      {/* Main Console Header */}
      <header className={clsx(
        "relative z-20 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors duration-300",
        isLight && "bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm",
        isContrast && "bg-black border-b border-zinc-800",
        isCyber && "border-b border-emerald-900/40 glass-panel"
      )}>
        <div className="flex items-center">
          <div className="mr-3">
            <BrandLogoDisplay
              customLogoUrl={brand.customLogoUrl}
              logoIcon={brand.logoIcon || 'LayoutDashboard'}
              logoStyleMode={brand.logoStyleMode || 'clean'}
              themeMode={activeTheme}
              size="md"
            />
          </div>
          <span 
            className={clsx(
              "font-bold tracking-tight font-display text-xl mt-0.5 select-none transition-colors",
              isLight && "text-slate-900",
              isContrast && "text-white",
              isCyber && "text-white"
            )} 
            style={isCyber ? { textShadow: `0 0 10px color-mix(in srgb, hsl(${themeHue} ${brand.themeSaturation || '84%'} 44%) 30%, transparent)` } : undefined}
          >
            {brand.appNamePrefix || 'Portfolio'}<span className={clsx(
              "transition-colors duration-500",
              isLight ? "text-emerald-600" : "text-emerald-500"
            )}>{brand.appNameSuffix || 'OS'}</span>
          </span>
        </div>

        {/* Right Header: Theme Switcher & Read-Only Badge */}
        <div className="flex items-center gap-2">
          <div className={clsx(
            "hidden sm:flex items-center rounded-lg p-1 border",
            isLight ? "bg-slate-100 border-slate-300" : "bg-black/60 border-zinc-800"
          )}>
            <button
              onClick={() => setActiveTheme('light')}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                isLight ? "bg-white text-slate-900 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Sáng Báo Cáo</span>
            </button>
            <button
              onClick={() => setActiveTheme('contrast')}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                isContrast ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Tối Tương Phản</span>
            </button>
            <button
              onClick={() => setActiveTheme('cyber')}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                isCyber ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cyber Neon</span>
            </button>
          </div>

          <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border",
            isLight ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
          )}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>KHÁCH HÀNG (CHỈ XEM)</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-5 pb-10">
          
          {/* Optional Broker's Direct Notes Banner */}
          {data.brokerNotes && (
            <div className={clsx(
              "p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 shadow-lg",
              isLight ? "bg-emerald-50/90 border-emerald-200 text-emerald-950" : "bg-emerald-950/30 border-emerald-500/30 text-emerald-200 glass-panel"
            )}>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold tracking-widest block text-emerald-400">
                  LỜI NHẮN / KHUYẾN NGHỊ TỪ MÔI GIỚI:
                </span>
                <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {data.brokerNotes}
                </p>
              </div>
            </div>
          )}

          {/* Top Banner & Control Bar (Identical Layout & Buttons) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 relative z-10">
            <div>
              <h2 
                className={clsx(
                  "text-2xl sm:text-3xl font-bold tracking-tight font-display flex items-center uppercase",
                  isLight && "text-slate-900",
                  isContrast && "text-white",
                  isCyber && "text-white drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
              >
                {boardTitle}
              </h2>
              <p className={clsx(
                "mt-1 font-mono text-xs uppercase tracking-widest relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1",
                isLight ? "text-slate-600" : "text-emerald-500/70"
              )}>
                <span className={clsx(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border",
                  isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
                )}>
                  <span className={clsx("w-1.5 h-1.5 rounded-full", isFetchingPrices ? "bg-amber-500 animate-ping" : "bg-emerald-500 animate-pulse")}></span>
                  <span>Theo Dõi Danh Mục Đầu Tư V1.0</span>
                </span>
                {lastUpdated && (
                  <span className={clsx(
                    "text-[10px] lowercase tracking-normal flex items-center gap-1 px-2 py-0.5 rounded font-mono border",
                    isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-black/40 border-emerald-950/40 text-emerald-400/80"
                  )}>
                    cập nhật giá: <span className={clsx("font-bold tracking-widest uppercase", isLight ? "text-slate-900" : "text-emerald-400")}>{lastUpdated}</span>
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              {/* Density Toggle Button */}
              <button
                onClick={() => setDensityMode(isCompact ? 'standard' : 'compact')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border",
                  isCompact 
                    ? (isLight ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" : "bg-emerald-950/90 border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]")
                    : (isLight ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100" : "bg-zinc-900/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800")
                )}
              >
                {isCompact ? <Smartphone className="w-3.5 h-3.5 text-emerald-300" /> : <Monitor className="w-3.5 h-3.5" />}
                <span>MẬT ĐỘ: {isCompact ? "THU GỌN" : "CHUẨN"}</span>
              </button>

              {/* Refresh prices button */}
              <Button 
                variant="outline" 
                size="sm" 
                className={clsx(
                  "transition-all font-semibold",
                  isLight ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-100" : "bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40"
                )}
                onClick={fetchLivePrices} 
                disabled={isFetchingPrices}
              >
                <RefreshCw className={clsx("h-3.5 w-3.5 mr-1.5", isFetchingPrices ? "animate-spin text-amber-500" : (isLight ? "text-emerald-700" : "text-emerald-400"))} />
                {isFetchingPrices ? "ĐANG TẢI..." : "CẬP NHẬT GIÁ"}
              </Button>

              {/* Sorting button */}
              <Button 
                variant="outline" 
                size="sm" 
                className={clsx(
                  "transition-all font-semibold",
                  sortOrder !== 'none'
                    ? (isLight ? "bg-emerald-100 text-emerald-900 border-emerald-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/70")
                    : (isLight ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-100" : "bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40")
                )}
                onClick={toggleSortOrder}
              >
                <ArrowUpDown className={clsx(
                  "h-3.5 w-3.5 mr-1.5 transition-transform duration-300",
                  sortOrder === 'desc' && "rotate-180 text-emerald-500",
                  sortOrder === 'asc' && "text-rose-500"
                )} />
                SẮP XẾP: {sortOrder === 'none' ? 'MẶC ĐỊNH' : sortOrder === 'desc' ? 'LÃI → LỖ' : 'LỖ → LÃI'}
              </Button>

              {/* Allocation chart modal button */}
              <Button 
                variant="outline" 
                size="sm" 
                className={clsx(
                  "transition-all font-semibold",
                  isLight ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-100" : "bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40"
                )}
                onClick={() => setShowAllocationModal(true)}
              >
                <PieChart className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                BIỂU ĐỒ
              </Button>
            </div>
          </div>

          {/* Metric Cards Summary (3 Cards - Exact Same) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Tỷ trọng cổ phiếu */}
            <div className={clsx(
              "p-4 rounded-xl border transition-all relative overflow-hidden",
              isLight && "bg-white border-slate-200 shadow-sm text-slate-900",
              isContrast && "bg-black border-zinc-800 text-white",
              isCyber && "bg-black/40 border-emerald-500/30 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            )}>
              <div className={clsx(
                "text-xs mb-1 uppercase tracking-widest font-mono font-bold",
                isLight ? "text-slate-500" : "text-emerald-400"
              )}>
                TỶ TRỌNG CỔ PHIẾU
              </div>
              <div className={clsx("text-2xl sm:text-3xl font-black font-mono tabular-nums mt-1", isLight ? "text-slate-900" : "text-white")}>
                {portfolioStockWeight}%
              </div>
            </div>

            {/* Tỷ trọng tiền mặt */}
            <div className={clsx(
              "p-4 rounded-xl border transition-all relative overflow-hidden",
              isLight && "bg-white border-slate-200 shadow-sm text-slate-900",
              isContrast && "bg-black border-zinc-800 text-white",
              isCyber && "bg-black/40 border-emerald-500/30 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            )}>
              <div className={clsx(
                "text-xs mb-1 uppercase tracking-widest font-mono font-bold",
                isLight ? "text-slate-500" : "text-emerald-400"
              )}>
                TỶ TRỌNG TIỀN MẶT
              </div>
              <div className={clsx("text-2xl sm:text-3xl font-black font-mono tabular-nums mt-1", isLight ? "text-slate-900" : "text-white")}>
                {100 - portfolioStockWeight}%
              </div>
            </div>

            {/* % Lãi Lỗ Danh Mục */}
            <div className={clsx(
              "p-4 rounded-xl border transition-all relative overflow-hidden",
              isLight && "bg-white border-slate-200 shadow-sm",
              isContrast && "bg-black border-zinc-800",
              isCyber && "bg-black/40 border-emerald-500/30 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            )}>
              <div className={clsx(
                "text-xs mb-1 uppercase tracking-widest font-mono font-bold",
                isLight ? "text-slate-500" : "text-emerald-400"
              )}>
                % LÃI/LỖ DANH MỤC
              </div>
              <div className={clsx(
                "text-2xl sm:text-3xl font-black font-mono tabular-nums mt-1",
                portfolioPLPercent >= 0 
                  ? (isLight ? "text-emerald-700" : (isRedTheme ? "text-[#34d399]" : "text-emerald-400"))
                  : (isLight ? "text-rose-600" : "text-rose-400")
              )}>
                {portfolioPLPercent > 0 ? '+' : ''}{portfolioPLPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Tag Filter Bar (Exact Same) */}
          <div className={clsx(
            "flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all",
            isLight && "bg-white border-slate-200 shadow-sm",
            isContrast && "bg-black border-zinc-800",
            isCyber && "bg-[#090f0c] border-emerald-900/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          )}>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative z-10 w-full lg:w-auto">
              <span className={clsx(
                "text-[11px] font-bold font-mono uppercase tracking-widest mr-1 flex items-center gap-1.5 whitespace-nowrap",
                isLight ? "text-slate-700" : "text-emerald-400/80"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Phân Loại Ngành & Chiến Lược:
              </span>
              <button
                onClick={() => setSelectedTag('Tất cả')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 border",
                  selectedTag === 'Tất cả' 
                    ? (isLight ? "bg-emerald-700 text-white border-emerald-800 font-bold shadow-sm" : "bg-emerald-500/25 border-emerald-500/70 text-emerald-300 font-bold")
                    : (isLight ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-black/40 border-emerald-950/45 text-slate-400 hover:text-emerald-300")
                )}
              >
                TẤT CẢ ({positions.length})
              </button>
              {allTags.map(tag => {
                const count = positions.filter(p => p.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 border flex items-center gap-1.5",
                      selectedTag === tag 
                        ? (isLight ? "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold" : "bg-emerald-500/25 border-emerald-500/80 text-emerald-300 font-bold")
                        : (isLight ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200" : "bg-black/35 border-emerald-950/30 text-slate-400 hover:text-emerald-300")
                    )}
                  >
                    #{tag}
                    <span className={clsx(
                      "text-[10px] px-1.5 py-0.2 select-none rounded font-bold transition-all", 
                      selectedTag === tag 
                        ? (isLight ? "bg-emerald-600 text-white" : "bg-emerald-500/40 text-emerald-100") 
                        : (isLight ? "bg-slate-200 text-slate-700" : "bg-emerald-950/50 text-emerald-400/75 border border-emerald-900/30")
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className={clsx(
              "text-[10px] font-mono uppercase tracking-wider relative z-10 hidden lg:block select-none",
              isLight ? "text-slate-500" : "text-slate-400/70"
            )}>
              * NHẤN NÚT <span className={isLight ? "text-emerald-700 font-bold" : "text-emerald-400 font-bold"}>"CHI TIẾT"</span> ĐỂ XEM THÔNG TIN DOANH NGHIỆP
            </div>
          </div>

          {/* Main Table Card (Exact Same Styling & Columns) */}
          <Card className={clsx(
            "overflow-hidden border transition-all",
            isLight && "bg-white border-slate-200 shadow-md",
            isContrast && "bg-black border-zinc-800",
            isCyber && "border-emerald-900/40 glass-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          )}>
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className={clsx(
                  "border-b font-sans uppercase font-bold tracking-wider",
                  isLight && "bg-slate-100 text-slate-700 border-slate-200",
                  isContrast && "bg-zinc-900 text-zinc-300 border-zinc-800",
                  isCyber && "bg-black/60 text-[#e0e0e0] border-zinc-800"
                )}>
                  <tr>
                    <th className={clsx(
                      "border-r text-center font-bold whitespace-nowrap",
                      isCompact ? "p-2 w-32 min-w-[125px]" : "p-3 w-44 min-w-[170px]",
                      isLight ? "border-slate-200" : "border-zinc-800/60"
                    )}>
                      MÃ CP
                    </th>
                    {Array.from({ length: maxBuys }).map((_, i) => (
                      <th
                        key={i}
                        className={clsx(
                          "border-r text-center font-bold whitespace-nowrap",
                          isCompact ? "p-2 min-w-[130px]" : "p-3 min-w-[170px]",
                          isLight ? "border-slate-200 bg-slate-50/60" : "border-zinc-800/60 bg-zinc-900/10"
                        )}
                      >
                        MUA {i + 1}
                      </th>
                    ))}
                    <th className={clsx(
                      "border-r text-right font-bold whitespace-nowrap",
                      isCompact ? "p-2 w-36 min-w-[130px]" : "p-3 w-44 min-w-[170px]",
                      isLight ? "border-slate-200" : "border-zinc-800/60"
                    )}>
                      GIÁ VỐN TB
                    </th>
                    <th className={clsx(
                      "border-r text-right font-bold whitespace-nowrap",
                      isCompact ? "p-2 w-36 min-w-[130px]" : "p-3 w-40 min-w-[150px]",
                      isLight ? "border-slate-200" : "border-zinc-800/60"
                    )}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Activity className={clsx("w-3.5 h-3.5", isLight ? "text-slate-500" : "text-zinc-400")} /> 
                        GIÁ HIỆN TẠI
                      </div>
                    </th>
                    <th 
                      className={clsx(
                        "text-right font-bold whitespace-nowrap cursor-pointer select-none transition-all group",
                        isCompact ? "p-2 w-36 min-w-[130px]" : "p-3 w-44 min-w-[170px]",
                        isLight ? "hover:bg-slate-200/60 text-slate-800 hover:text-emerald-800" : "hover:bg-black/40 hover:text-emerald-400"
                      )}
                      onClick={toggleSortOrder}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>% LÃI/LỖ</span>
                        <ArrowUpDown className={clsx(
                          "w-3.5 h-3.5 transition-all duration-300", 
                          sortOrder === 'none' && "text-zinc-400 opacity-40 group-hover:opacity-100",
                          sortOrder === 'desc' && "text-emerald-500 rotate-180",
                          sortOrder === 'asc' && "text-rose-500"
                        )} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={clsx(
                  "divide-y font-mono",
                  isLight && "divide-slate-200",
                  isContrast && "divide-zinc-800",
                  isCyber && "divide-emerald-900/20"
                )}>
                  {displayPositions.map((pos) => {
                    const priceDiff = pos.currentPrice - pos.averageCost;
                    const diffVND = Math.round(priceDiff * 1000);
                    const isProfit = pos.unrealizedPLPercent >= 0;

                    return (
                      <tr 
                        key={pos.id} 
                        className={clsx(
                          "transition-all duration-300",
                          pos.isHighlighted && (
                            isLight 
                              ? "bg-emerald-50/80 border-y border-emerald-300" 
                              : "bg-emerald-400/5 relative z-10 border-y border-emerald-400/30 shadow-[inset_0_0_20px_rgba(52,211,153,0.1)]"
                          ),
                          !pos.isHighlighted && (
                            isLight ? "hover:bg-slate-50" : "hover:bg-emerald-900/10"
                          )
                        )}
                      >
                        {/* Column 1: Mã CP */}
                        <td className={clsx(
                          "border-r align-top transition-colors duration-300",
                          isCompact ? "p-1.5" : "p-3",
                          isLight ? "border-slate-200" : (pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")
                        )}>
                          <div className="flex gap-1.5 items-start">
                            {pos.isHighlighted && (
                              <div className="pt-1 text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                              </div>
                            )}

                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className={clsx(
                                "w-full rounded font-black uppercase text-center transition-colors shadow-inner font-mono tracking-widest border tabular-nums flex items-center justify-center",
                                isCompact ? "px-1.5 py-1 text-base sm:text-lg h-8.5" : "px-3 py-2 text-lg sm:text-xl lg:text-2xl font-black",
                                isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-black/60 border-zinc-800 text-white"
                              )}>
                                {pos.symbol}
                              </div>
                              
                              {pos.symbol && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={clsx(
                                    "w-full text-[10px] transition-all font-mono tracking-wider",
                                    isCompact ? "h-6 px-1" : "h-7",
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40"
                                  )}
                                  onClick={() => setSelectedDashboardPosition(pos)}
                                >
                                  <LayoutDashboard className="w-2.5 h-2.5 mr-1" />
                                  CHI TIẾT
                                </Button>
                              )}

                              {pos.symbol && (pos.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5 justify-center max-w-full">
                                  {pos.tags?.map(t => (
                                    <span 
                                      key={t} 
                                      className={`${getTagStyles(t, isLight)} text-[10px] px-1.5 py-0.2 rounded border font-mono font-semibold tracking-tight whitespace-nowrap`}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Buy columns */}
                        {Array.from({ length: maxBuys }).map((_, i) => {
                          const buy = pos.buys[i];
                          return (
                            <td 
                              key={i} 
                              className={clsx(
                                "border-r align-top relative transition-colors duration-300",
                                isCompact ? "p-1.5" : "p-2",
                                isLight ? "border-slate-200 bg-slate-50/30" : "border-emerald-900/30 bg-emerald-950/10"
                              )}
                            >
                              {buy !== undefined && buy.price > 0 ? (
                                <div className="relative z-10 w-full pt-0.5">
                                  <div className={clsx(
                                    "w-full rounded text-center transition-colors font-mono font-bold border shadow-inner tabular-nums flex items-center justify-center",
                                    isCompact ? "px-1.5 py-1 text-sm sm:text-base h-8.5" : "px-3 py-2 text-base md:text-lg lg:text-xl",
                                    isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-black/60 border-zinc-800 text-white"
                                  )}>
                                    {formatStockPrice(buy.price)}
                                  </div>
                                  <div className={clsx(
                                    "text-[10px] text-center font-mono mt-1",
                                    isLight ? "text-slate-500" : "text-zinc-400"
                                  )}>
                                    {formatCurrency(buy.volume || 1000)} cp
                                  </div>
                                </div>
                              ) : (
                                <div className={clsx(
                                  "mt-0.5 flex items-center justify-center opacity-30 italic text-xs border border-dashed rounded font-mono uppercase tracking-wider",
                                  isCompact ? "h-8.5" : "h-[46px]",
                                  isLight ? "border-slate-300 text-slate-500" : "border-emerald-900/40 text-slate-400"
                                )}>
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                        
                        {/* Avg Cost */}
                        <td className={clsx(
                          "border-r text-right align-top whitespace-nowrap transition-colors duration-300",
                          isCompact ? "p-1.5 pt-2" : "p-3 pt-3",
                          isLight ? "border-slate-200" : "border-emerald-900/30"
                        )}>
                          <div className={clsx(
                            "font-black font-mono tabular-nums",
                            isCompact ? "text-base sm:text-lg" : "text-lg md:text-xl lg:text-2xl",
                            isLight ? "text-slate-900" : "text-emerald-50"
                          )}>
                            {formatStockPrice(pos.averageCost)}
                          </div>
                          <div className={clsx(
                            "text-xs font-mono font-medium tracking-tight mt-0.5 tabular-nums",
                            isLight ? "text-slate-600" : "text-zinc-400"
                          )}>
                            ~ {formatCurrency(Math.round(pos.averageCost * 1000))} đ
                          </div>
                        </td>

                        {/* Current Price */}
                        <td className={clsx(
                          "border-r text-right align-top transition-colors duration-300",
                          isCompact ? "p-1.5 pt-1.5" : "p-3 pt-2",
                          isLight ? "border-slate-200" : "border-emerald-900/30"
                        )}>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap w-full">
                              <div className={clsx(
                                "w-2.5 h-2.5 rounded-full animate-pulse shrink-0", 
                                isProfit 
                                  ? (isLight ? "bg-emerald-600" : "bg-emerald-500") 
                                  : "bg-rose-500"
                              )} />
                              <div className={clsx(
                                "rounded text-right font-black font-mono transition-all border shadow-inner tabular-nums flex items-center justify-end",
                                isCompact ? "w-24 sm:w-28 px-1.5 py-0.5 text-base sm:text-lg h-8.5" : "w-28 sm:w-32 px-2 py-1 text-lg md:text-xl lg:text-2xl",
                                isLight 
                                  ? (isProfit ? "bg-emerald-50/70 border-emerald-300 text-emerald-800" : "bg-rose-50/70 border-rose-300 text-rose-700")
                                  : (isProfit ? "bg-black/60 border-zinc-800 text-emerald-400" : "bg-black/60 border-zinc-800 text-rose-400")
                              )}>
                                {formatStockPrice(pos.currentPrice)}
                              </div>
                            </div>
                            <div className={clsx(
                              "text-xs font-mono font-bold tracking-tight tabular-nums mt-0.5",
                              isProfit 
                                ? (isLight ? "text-emerald-700" : "text-emerald-400")
                                : (isLight ? "text-rose-600" : "text-rose-400")
                            )}>
                              {priceDiff > 0 ? `+${formatCurrency(diffVND)}` : formatCurrency(diffVND)} đ
                            </div>
                          </div>
                        </td>

                        {/* % Lãi / Lỗ */}
                        <td className={clsx(
                          "text-right align-top whitespace-nowrap transition-colors duration-300",
                          isCompact ? "p-1.5 pt-2" : "p-3 pt-3"
                        )}>
                          <div className={clsx(
                            "font-black font-mono tabular-nums tracking-tight",
                            isCompact ? "text-base sm:text-lg" : "text-lg md:text-xl lg:text-2xl",
                            isProfit 
                              ? (isLight ? "text-emerald-700" : "text-emerald-400") 
                              : (isLight ? "text-rose-600" : "text-rose-400")
                          )}>
                            {pos.unrealizedPLPercent > 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                          </div>
                          <div className="mt-1 flex items-center justify-end">
                            {isProfit ? (
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-black tracking-wider border select-none",
                                isLight ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              )}>
                                ▲ LÃI
                              </span>
                            ) : (
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-black tracking-wider border select-none",
                                isLight ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              )}>
                                ▼ LỖ
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* Stock Dashboard Modal for Client */}
      {selectedDashboardPosition && (
        <ReadOnlyStockDetailModal
          position={selectedDashboardPosition}
          onClose={() => setSelectedDashboardPosition(null)}
        />
      )}

      {/* Allocation Breakdown Chart Modal */}
      <AllocationModal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        overridePositions={finalPositions}
        isReadOnly={true}
      />
    </div>
  );
}
