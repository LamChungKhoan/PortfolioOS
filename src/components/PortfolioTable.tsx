import React, { useState, useEffect, useRef } from 'react';
import { useStore, useDerivedPortfolio } from '../store/useStore';
import { Card, Button } from './ui/core';
import { Plus, Trash2, X, Activity, LayoutDashboard, ChevronUp, ChevronDown, Star, Camera, PieChart, RefreshCw, ArrowUpDown, Smartphone, Monitor, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import { StockDashboardModal } from './StockDashboardModal';
import { AllocationModal } from './AllocationModal';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';

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

export function PortfolioTable() {
  const { positions, cashBalance, totalNav, totalUnrealizedPL, portfolioPLPercent } = useDerivedPortfolio();
  const portfolioStockWeight = useStore(state => state.portfolioStockWeight);
  const setPortfolioStockWeight = useStore(state => state.setPortfolioStockWeight);
  const lastUpdated = useStore(state => state.lastUpdated);
  const isFetchingPrices = useStore(state => state.isFetchingPrices);
  const brandSettings = useStore(state => state.brandSettings);
  const themeMode = useStore(state => state.themeMode || 'cyber');
  const densityMode = useStore(state => state.densityMode || 'standard');
  const setDensityMode = useStore(state => state.setDensityMode);

  const isLight = themeMode === 'light';
  const isContrast = themeMode === 'contrast';
  const isCyber = themeMode === 'cyber';
  const isCompact = densityMode === 'compact';

  const themeHue = brandSettings?.themeHue ?? 161;
  const isRedTheme = themeHue > 330 || themeHue <= 18;
  
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [sortOrder, setSortOrder] = useState<'none' | 'desc' | 'asc'>('none');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const allTags = Array.from(new Set(positions.flatMap(p => p.tags || [])));
  
  const filteredPositions = selectedTag === 'Tất cả'
    ? positions
    : positions.filter(p => p.tags?.includes(selectedTag));

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  const displayPositions = [...filteredPositions];
  if (sortOrder === 'desc') {
    displayPositions.sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent);
  } else if (sortOrder === 'asc') {
    displayPositions.sort((a, b) => a.unrealizedPLPercent - b.unrealizedPLPercent);
  }

  useEffect(() => {
    if (selectedTag !== 'Tất cả' && !allTags.includes(selectedTag)) {
      setSelectedTag('Tất cả');
    }
  }, [allTags, selectedTag]);
  
  const addPosition = useStore(state => state.addPosition);
  const removePosition = useStore(state => state.removePosition);
  const updateSymbol = useStore(state => state.updateSymbol);
  
  const addBuy = useStore(state => state.addBuy);
  const updateBuy = useStore(state => state.updateBuy);
  const removeBuy = useStore(state => state.removeBuy);
  
  const setCashBalance = useStore(state => state.setCashBalance);
  const fetchLivePrices = useStore(state => state.fetchLivePrices);
  const movePosition = useStore(state => state.movePosition);
  const toggleHighlight = useStore(state => state.toggleHighlight);
  const updateMarketPrice = useStore(state => state.updateMarketPrice);
  const boardTitle = useStore(state => state.boardTitle);
  const setBoardTitle = useStore(state => state.setBoardTitle);

  const [isEditingCash, setIsEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-refresh prices to simulate live market integration (1 minute interval)
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 60000); // refresh every 1 minute (60,000ms)
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      setBoardTitle(titleInput.trim().toUpperCase());
    }
    setIsEditingTitle(false);
  };

  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashInput) {
      setCashBalance(Number(cashInput));
      setIsEditingCash(false);
    }
  };

  const handleAddPosition = () => {
    addPosition('');
  };

  const maxBuys = Math.max(1, ...positions.map(p => p.buys.length));

  return (
    <div className="space-y-5 pb-10" ref={tableRef}>
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 relative z-10" data-html2canvas-ignore={true}>
        <div className="relative">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="relative z-10 -ml-2 mb-1">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                className={clsx(
                  "border rounded px-2 py-0.5 text-2xl sm:text-3xl font-bold font-display focus:outline-none w-full min-w-[280px] max-w-md uppercase shadow-inner",
                  isLight ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-600" : "bg-zinc-900/80 border-zinc-700 text-white focus:border-emerald-500"
                )}
                placeholder="NHẬP TÊN BẢNG..."
              />
            </form>
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <h2 
                className={clsx(
                  "text-2xl sm:text-3xl font-bold tracking-tight font-display cursor-pointer transition-colors group flex items-center",
                  isLight && "text-slate-900 hover:text-emerald-700",
                  isContrast && "text-white hover:text-emerald-400",
                  isCyber && "text-white hover:text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
                onClick={() => {
                  if (isCapturing) return;
                  setIsEditingTitle(true);
                  setTitleInput(boardTitle);
                }}
                title="Nhấn để đổi tên bảng"
              >
                {boardTitle}
                {!isCapturing && (
                  <span className={clsx(
                    "opacity-0 group-hover:opacity-100 transition-opacity ml-3 text-[10px] font-mono uppercase tracking-widest border px-1.5 py-0.5 rounded whitespace-nowrap",
                    isLight ? "text-emerald-800 border-emerald-300 bg-emerald-50" : "text-emerald-400 border-emerald-500/30 bg-emerald-950/40"
                  )}>
                    ĐỔI TÊN
                  </span>
                )}
              </h2>
            </div>
          )}
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
        <div className={clsx("flex flex-wrap items-center gap-2 relative z-10 transition-opacity", isCapturing && "opacity-0")}>
          {/* Density Toggle Button */}
          <button
            onClick={() => setDensityMode(isCompact ? 'standard' : 'compact')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border",
              isCompact 
                ? (isLight ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" : "bg-emerald-950/90 border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]")
                : (isLight ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100" : "bg-zinc-900/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800")
            )}
            title="Bật chế độ thu gọn để giảm lề, các cột xếp sát nhau, dễ xem trên điện thoại và chụp ảnh"
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
            onClick={() => fetchLivePrices(true)} 
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
            title="Đổi chiều sắp xếp theo % Lãi/Lỗ hoặc phục hồi mặc định"
          >
            <ArrowUpDown className={clsx(
              "h-3.5 w-3.5 mr-1.5 transition-transform duration-300",
              sortOrder === 'desc' && "rotate-180 text-emerald-500",
              sortOrder === 'asc' && "text-rose-500"
            )} />
            SẮP XẾP: {sortOrder === 'none' ? 'MẶC ĐỊNH' : sortOrder === 'desc' ? 'LÃI → LỖ' : 'LỖ → LÃI'}
          </Button>

          {/* Export Report modal button */}
          <Button 
            variant="outline" 
            size="sm" 
            className={clsx(
              "transition-all font-bold",
              isLight 
                ? "bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100 shadow-sm" 
                : "bg-emerald-950/40 hover:bg-emerald-900/70 hover:text-emerald-200 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            )}
            onClick={() => setShowExportModal(true)}
          >
            <Camera className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            XUẤT BÁO CÁO (3X)
          </Button>

          {/* Share Live Link for Client button */}
          <Button 
            variant="outline" 
            size="sm" 
            className={clsx(
              "transition-all font-bold",
              isLight 
                ? "bg-cyan-50 text-cyan-900 border-cyan-400 hover:bg-cyan-100 shadow-sm" 
                : "bg-cyan-950/40 hover:bg-cyan-900/70 hover:text-cyan-200 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            )}
            onClick={() => setShowShareModal(true)}
            title="Tạo đường link xem trực tiếp dành riêng cho Khách Hàng (Đã khóa quyền sửa)"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            LINK KHÁCH XEM
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

          {/* Add stock button */}
          <Button 
            size="sm" 
            onClick={handleAddPosition} 
            className={clsx(
              "text-white shadow-md font-bold",
              isLight ? "bg-emerald-700 hover:bg-emerald-800" : "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            )}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            THÊM MÃ MỚI
          </Button>
        </div>
      </div>

      {/* Metric Cards Summary */}
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
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className={clsx("text-2xl sm:text-3xl font-black font-mono tabular-nums", isLight ? "text-slate-900" : "text-white")}>
              {portfolioStockWeight}%
            </div>
            <div className="flex-1 max-w-[140px] flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={portfolioStockWeight}
                onChange={(e) => setPortfolioStockWeight(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={portfolioStockWeight}
                onChange={(e) => {
                  let val = Math.min(100, Math.max(0, Number(e.target.value)));
                  setPortfolioStockWeight(val);
                }}
                className={clsx(
                  "w-12 rounded px-1 py-0.5 text-xs text-center font-mono font-bold focus:outline-none border tabular-nums",
                  isLight ? "bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-600" : "bg-black/60 border-emerald-950/60 text-emerald-400 focus:border-emerald-500"
                )}
              />
            </div>
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

      {isEditingCash && (
        <Card className="p-4 border-zinc-800/80 bg-zinc-950/40 glass-panel">
          <form onSubmit={handleCashSubmit} className="flex gap-4 items-end">
            <div className="space-y-1 flex-1 max-w-sm">
              <label className="text-[11px] font-semibold font-sans uppercase text-[#e0e0e0] tracking-widest">LIQUID INPUT (VND)</label>
              <input
                type="number"
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 rounded p-2 text-sm text-[#e0e0e0] focus:outline-none focus:border-zinc-600 shadow-inner font-mono"
                placeholder="Nhập số tiền..."
              />
            </div>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              COMMIT
            </Button>
          </form>
        </Card>
      )}

      {/* COMPONENT PHÂN LOẠI DANH MỤC & NHÃN CHIẾN LƯỢC */}
      <div className={clsx(
        "flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all",
        isLight && "bg-white border-slate-200 shadow-sm",
        isContrast && "bg-black border-zinc-800",
        isCyber && "bg-[#090f0c] border-emerald-900/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
      )} data-html2canvas-ignore={true}>
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
          * ĐỂ GẮN NHÃN: NHẤN NÚT <span className={isLight ? "text-emerald-700 font-bold" : "text-emerald-400 font-bold"}>"CHI TIẾT"</span> Ở DÒNG CỔ PHIẾU
        </div>
      </div>

      {/* Main Table Card */}
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
                  "border-r text-center font-bold whitespace-nowrap",
                  isCompact ? "p-2 w-16 min-w-[60px]" : "p-3 w-24 min-w-[85px]",
                  isLight ? "border-slate-200" : "border-zinc-800/60"
                )}>
                  THÊM
                </th>
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
                    "border-r text-right font-bold whitespace-nowrap cursor-pointer select-none transition-all group",
                    isCompact ? "p-2 w-36 min-w-[130px]" : "p-3 w-44 min-w-[170px]",
                    isLight ? "border-slate-200 hover:bg-slate-200/60 text-slate-800 hover:text-emerald-800" : "border-zinc-800/60 hover:bg-black/40 hover:text-emerald-400"
                  )}
                  onClick={toggleSortOrder}
                  title="Nhấn để sắp xếp % Lãi/Lỗ"
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
                <th className={clsx(
                  "text-center font-bold whitespace-nowrap",
                  isCompact ? "p-2 w-12 min-w-[45px]" : "p-3 w-16 min-w-[65px]"
                )}>
                  XÓA
                </th>
              </tr>
            </thead>
            <motion.tbody layout className={clsx(
              "divide-y font-mono",
              isLight && "divide-slate-200",
              isContrast && "divide-zinc-800",
              isCyber && "divide-emerald-900/20"
            )}>
              <AnimatePresence>
                {displayPositions.map((pos) => {
                  const priceDiff = pos.currentPrice - pos.averageCost;
                  const diffVND = Math.round(priceDiff * 1000);
                  const isProfit = pos.unrealizedPLPercent >= 0;

                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0, transition: { duration: 0.2 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
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
                          {/* Ordering / Highlight controls */}
                          <div className="flex flex-col gap-0.5 justify-center pt-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={clsx(
                                "h-4 w-4 sm:h-5 sm:w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center",
                                pos.isHighlighted
                                  ? (isLight ? "bg-amber-100 border-amber-400 text-amber-600" : "bg-emerald-900/60 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]")
                                  : (isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-400 hover:text-amber-500" : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500/50 hover:text-emerald-400")
                              )}
                              onClick={() => toggleHighlight(pos.id)}
                              title="Đánh dấu nổi bật"
                            >
                              <Star className={clsx("w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all", pos.isHighlighted && "fill-amber-400 text-amber-500")} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={clsx(
                                "h-4 w-4 sm:h-5 sm:w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center",
                                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600" : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500 hover:text-emerald-300"
                              )}
                              onClick={() => movePosition(pos.id, 'up')}
                              disabled={sortOrder !== 'none' || positions.indexOf(pos) === 0}
                              title={sortOrder !== 'none' ? "Tắt sắp xếp để di chuyển" : "Di chuyển lên"}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={clsx(
                                "h-4 w-4 sm:h-5 sm:w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center",
                                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600" : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500 hover:text-emerald-300"
                              )}
                              onClick={() => movePosition(pos.id, 'down')}
                              disabled={sortOrder !== 'none' || positions.indexOf(pos) === positions.length - 1}
                              title={sortOrder !== 'none' ? "Tắt sắp xếp để di chuyển" : "Di chuyển xuống"}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <input
                              type="text"
                              className={clsx(
                                "w-full rounded font-black uppercase text-center transition-colors shadow-inner font-mono tracking-widest placeholder:opacity-40 border tabular-nums",
                                isCompact ? "px-1.5 py-1 text-base sm:text-lg h-8.5" : "px-3 py-2 text-lg sm:text-xl lg:text-2xl font-black",
                                isLight ? "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600" : "bg-black/60 border-zinc-800 text-white focus:border-zinc-600"
                              )}
                              value={pos.symbol}
                              placeholder="MÃ CP"
                              onChange={(e) => updateSymbol(pos.id, e.target.value)}
                            />
                            {pos.symbol && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={clsx(
                                  "w-full text-[10px] transition-all font-mono tracking-wider",
                                  isCompact ? "h-6 px-1" : "h-7",
                                  isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40"
                                )}
                                onClick={() => setActiveDashboardId(pos.id)}
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
                                    title={`Nhãn: ${t}`}
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
                              "border-r align-top relative group transition-colors duration-300",
                              isCompact ? "p-1.5" : "p-2",
                              isLight ? "border-slate-200 bg-slate-50/30" : "border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-900/20"
                            )}
                          >
                            {buy !== undefined ? (
                              <div className="relative z-10 w-full pt-0.5">
                                <input
                                  type="number"
                                  step="any"
                                  className={clsx(
                                    "w-full rounded text-center transition-colors font-mono font-bold border shadow-inner tabular-nums",
                                    isCompact ? "px-1.5 py-1 text-sm sm:text-base h-8.5" : "px-3 py-2 text-base md:text-lg lg:text-xl",
                                    isLight ? "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600" : "bg-black/60 border-zinc-800 text-white focus:border-zinc-600"
                                  )}
                                  value={buy.price || ''}
                                  placeholder="0.00"
                                  onChange={(e) => updateBuy(pos.id, i, Number(e.target.value), buy.volume || 1000)}
                                />
                                {pos.buys.length > 1 && (
                                  <button 
                                    onClick={() => removeBuy(pos.id, i)}
                                    className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 text-rose-500 bg-white dark:bg-black/90 rounded-full p-0.5 border border-rose-300 dark:border-rose-500/50 hover:bg-rose-100 transition-all z-20 shadow-sm"
                                    title="Xóa giao dịch"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
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
                      
                      {/* Add buy button */}
                      <td className={clsx(
                        "border-r text-center align-top transition-colors duration-300",
                        isCompact ? "p-1.5 pt-2" : "p-3 pt-4",
                        isLight ? "border-slate-200" : "border-emerald-900/30"
                      )}>
                        {pos.buys.length < 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={clsx(
                              "p-0 rounded-full mx-auto transition-all border",
                              isCompact ? "h-7 w-7" : "h-8 w-8",
                              isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 border-emerald-500/30"
                            )}
                            onClick={() => addBuy(pos.id)}
                            title="Thêm lần mua"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>

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
                            <input
                              type="number"
                              step="any"
                              className={clsx(
                                "rounded text-right font-black font-mono transition-all focus:outline-none border shadow-inner tabular-nums",
                                isCompact ? "w-24 sm:w-28 px-1.5 py-0.5 text-base sm:text-lg h-8.5" : "w-28 sm:w-32 px-2 py-1 text-lg md:text-xl lg:text-2xl",
                                isLight 
                                  ? (isProfit ? "bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:bg-white" : "bg-rose-50/70 border-rose-300 text-rose-700 focus:bg-white")
                                  : (isProfit ? "bg-black/60 border-zinc-800 text-emerald-400 focus:border-zinc-700" : "bg-black/60 border-zinc-800 text-rose-400 focus:border-zinc-700")
                              )}
                              value={pos.currentPrice || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                updateMarketPrice(pos.symbol || '', val);
                              }}
                            />
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
                        "border-r text-right align-top whitespace-nowrap transition-colors duration-300",
                        isCompact ? "p-1.5 pt-2" : "p-3 pt-3",
                        isLight ? "border-slate-200" : "border-emerald-900/30"
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

                      {/* Delete button */}
                      <td className={clsx(
                        "text-center align-top",
                        isCompact ? "p-1.5 pt-2" : "p-3 pt-3"
                      )}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={clsx(
                            "p-0 mx-auto border transition-all",
                            isCompact ? "h-7 w-7" : "h-8 w-8",
                            isLight ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-200" : "text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 border-transparent hover:border-rose-500/30"
                          )}
                          onClick={() => removePosition(pos.id)}
                          title="Xóa mã này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              
              {displayPositions.length === 0 && (
                <tr>
                  <td colSpan={maxBuys + 6} className="p-16 text-center text-slate-400 font-mono tracking-widest bg-emerald-950/5">
                    <div className="max-w-sm mx-auto space-y-4">
                      <p className="opacity-70 text-xs uppercase">
                        {positions.length === 0 
                          ? "Không có mã chứng khoán nào." 
                          : "Không có mã nào kết nối với nhãn được chọn."}
                      </p>
                      {positions.length === 0 ? (
                        <Button onClick={handleAddPosition} className="bg-emerald-600 hover:bg-emerald-700 text-white uppercase text-xs px-6 py-2.5">
                          <Plus className="h-4 w-4 mr-2" />
                          THÊM MÃ ĐẦU TIÊN
                        </Button>
                      ) : (
                        <Button onClick={() => setSelectedTag('Tất cả')} className="bg-emerald-600 hover:bg-emerald-700 text-white uppercase text-xs px-6 py-2">
                          Xem toàn bộ danh mục
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </Card>
      
      {/* Modal Dialogs */}
      <StockDashboardModal 
        positionId={activeDashboardId} 
        onClose={() => setActiveDashboardId(null)}
      />

      <AllocationModal 
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
