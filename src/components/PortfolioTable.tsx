import React, { useState, useEffect, useRef } from 'react';
import { useStore, useDerivedPortfolio } from '../store/useStore';
import { Card, Button } from './ui/core';
import { Plus, Trash2, DollarSign, X, Activity, LayoutDashboard, Zap, ChevronUp, ChevronDown, Star, Camera, PieChart, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { StockDashboardModal } from './StockDashboardModal';
import { AllocationModal } from './AllocationModal';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

const formatStockPrice = (val: number) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const getTagStyles = (tag: string) => {
  const t = tag.toLowerCase().trim();
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
  const themeHue = brandSettings?.themeHue ?? 161;
  const isRedTheme = themeHue > 330 || themeHue <= 18;
  
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  
  const allTags = Array.from(new Set(positions.flatMap(p => p.tags || [])));
  
  const filteredPositions = selectedTag === 'Tất cả'
    ? positions
    : positions.filter(p => p.tags?.includes(selectedTag));

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

  const [isEditingCash, setIsEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [boardTitle, setBoardTitle] = useState('BẢNG ĐIỀU KHIỂN');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-refresh prices to simulate live market integration
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  const handleCapture = async () => {
    if (!tableRef.current) return;
    try {
      setIsCapturing(true);
      // Let React render to hide the buttons (opacity change, no layout shift)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const el = tableRef.current;
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        width: width + 64, // 32px horizontal padding each side
        height: height + 80, // 48px top, 32px bottom
        style: {
          background: '#040d0a', // Dark greenish black
          padding: '48px 32px 32px 32px',
          margin: '0',
          borderRadius: '16px',
        }
      });
      const link = document.createElement('a');
      link.download = `portfolio-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture snapshot', err);
    } finally {
      setIsCapturing(false);
    }
  };

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
    <div className="space-y-6 pb-10" ref={tableRef}>
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative z-10" data-html2canvas-ignore={true}>
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/5 blur-xl rounded-full z-0 pointer-events-none"></div>
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="relative z-10 -ml-2 mb-1">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                className="bg-zinc-900/60 border border-zinc-700 rounded px-2 py-0.5 text-3xl font-bold font-display text-[#e0e0e0] focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-650 shadow-inner w-full min-w-[300px] max-w-md uppercase"
                placeholder="NHẬP TÊN BẢNG..."
              />
            </form>
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <h2 
                className="text-3xl font-bold tracking-tight font-display text-white cursor-pointer hover:text-emerald-300 transition-colors group flex items-center" 
                style={{ textShadow: '0 0 20px rgba(16,185,129,0.3)' }}
                onClick={() => {
                  if(isCapturing) return;
                  setIsEditingTitle(true);
                  setTitleInput(boardTitle);
                }}
                title="Nhấn để đổi tên"
              >
                {boardTitle}
                {!isCapturing && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-950/30 whitespace-nowrap">
                    ĐỔI TÊN
                  </span>
                )}
              </h2>
            </div>
          )}
          <p className="text-emerald-500/70 mt-1 font-mono text-xs uppercase tracking-widest relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded text-[10px]">
              <span className={clsx("w-1.5 h-1.5 rounded-full", isFetchingPrices ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse")}></span>
              <span>Theo Dõi Danh Mục Đầu Tư V1.0</span>
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-emerald-500/60 lowercase tracking-normal flex items-center gap-1 bg-black/40 border border-emerald-950/40 px-2 py-0.5 rounded font-mono">
                cập nhật giá: <span className="text-emerald-400 font-bold tracking-widest uppercase">{lastUpdated}</span>
              </span>
            )}
          </p>
        </div>
        <div className={clsx("flex flex-wrap gap-3 relative z-10 transition-opacity justify-end", isCapturing && "opacity-0")}>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" 
            onClick={() => fetchLivePrices()} 
            disabled={isFetchingPrices}
          >
            <RefreshCw className={clsx("h-4 w-4 mr-2 text-emerald-400", isFetchingPrices && "animate-spin")} />
            {isFetchingPrices ? "ĐANG TẢI GIÁ..." : "CẬP NHẬT GIÁ"}
          </Button>
          <Button variant="outline" size="sm" className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" onClick={handleCapture} disabled={isCapturing}>
            <Camera className={clsx("h-4 w-4 mr-2 text-emerald-400", isCapturing && "animate-pulse")} />
            XUẤT BÁO CÁO
          </Button>
          <Button variant="outline" size="sm" className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" onClick={() => setShowAllocationModal(true)}>
            <PieChart className="h-4 w-4 mr-2 text-emerald-400" />
            BIỂU ĐỒ TÀI SẢN
          </Button>

          <Button size="sm" onClick={handleAddPosition} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Plus className="h-4 w-4 mr-2" />
            THÊM MÃ MỚI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 perspective-1000">
        <Card className="p-5 border-emerald-500/30 bg-black/40 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:rotate-x-12 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">TỶ TRỌNG CỔ PHIẾU</div>
          <div className="flex items-center justify-between gap-4 relative z-10 mt-1">
            <div className="text-3xl font-bold text-white font-mono">{portfolioStockWeight}%</div>
            <div className="flex-1 max-w-[140px] flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={portfolioStockWeight}
                onChange={(e) => setPortfolioStockWeight(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
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
                className="w-12 bg-black/60 border border-emerald-950/60 rounded px-1 py-0.5 text-xs text-center font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-emerald-500/30 bg-black/40 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">TỶ TRỌNG TIỀN MẶT</div>
          <div className="text-3xl font-bold text-white font-mono relative z-10 text-shadow-sm mt-1">{100 - portfolioStockWeight}%</div>
        </Card>
        <Card className="p-5 border-emerald-500/30 bg-black/40 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">% LÃI/LỖ DANH MỤC</div>
          <div className={clsx("text-3xl font-bold font-mono relative z-10 mt-1", portfolioPLPercent >= 0 ? (isRedTheme ? "text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]") : "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]")}>
            {portfolioPLPercent > 0 ? '+' : ''}{portfolioPLPercent.toFixed(2)}%
          </div>
        </Card>
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-emerald-900/30 bg-[#090f0c] rounded-xl backdrop-blur-md relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]" data-html2canvas-ignore={true}>
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full lg:w-auto">
          <span className="text-[11px] font-bold font-mono text-emerald-400/80 uppercase tracking-widest mr-2 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Phân Loại Ngành & Chiến Lược:
          </span>
          <button
            onClick={() => setSelectedTag('Tất cả')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border",
              selectedTag === 'Tất cả' 
                ? "bg-emerald-500/20 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_var(--theme-emerald-500)] font-bold animate-pulse-subtle" 
                : "bg-black/40 border-emerald-950/45 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30"
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
                  "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border flex items-center gap-1.5",
                  selectedTag === tag 
                    ? "bg-emerald-500/25 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_var(--theme-emerald-500)] font-bold" 
                    : "bg-black/35 border-emerald-950/30 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/15 hover:border-emerald-500/25"
                )}
              >
                #{tag}
                <span className={clsx(
                  "text-[10px] px-1.5 py-0.2 select-none rounded font-bold transition-all", 
                  selectedTag === tag ? "bg-emerald-500/40 text-emerald-100" : "bg-emerald-950/50 text-emerald-400/75 border border-emerald-900/30"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Help label */}
        <div className="text-[10px] font-mono text-slate-400/70 uppercase tracking-wider relative z-10 hidden lg:block select-none">
          * ĐỂ GẮN NHÃN/PHÂN LOẠI CP: NHẤN NÚT <span className="text-emerald-400 font-bold">"CHI TIẾT"</span> Ở DÒNG CỦA CỦA CỔ PHIẾU ĐÓ
        </div>
      </div>

      <Card className="overflow-hidden border-emerald-900/40 glass-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-black/60 text-[#e0e0e0] border-b border-zinc-800 font-sans">
              <tr>
                <th className="p-3 border-r border-zinc-800/60 w-44 uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] text-center flex-shrink-0 min-w-[170px] whitespace-nowrap">MÃ CP</th>
                {Array.from({ length: maxBuys }).map((_, i) => (
                  <th key={i} className="p-3 border-r border-zinc-800/60 min-w-[180px] uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] text-center bg-zinc-900/10 whitespace-nowrap">
                    GIAO DỊCH {i + 1}
                  </th>
                ))}
                <th className="p-3 border-r border-zinc-800/60 w-24 text-center uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] min-w-[85px] whitespace-nowrap">THÊM</th>
                <th className="p-3 border-r border-zinc-800/60 w-44 text-right uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] min-w-[170px] whitespace-nowrap">GIÁ VỐN TRUNG BÌNH</th>
                <th className="p-3 border-r border-zinc-800/60 w-40 text-right uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] min-w-[150px]">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" /> GIÁ HIỆN TẠI
                  </div>
                </th>
                <th className="p-3 border-r border-zinc-800/60 w-44 text-right uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] min-w-[180px] whitespace-nowrap">% LÃI/LỖ</th>
                <th className="p-3 w-16 text-center uppercase text-xs md:text-sm tracking-wider font-bold text-[#e0e0e0] min-w-[65px] whitespace-nowrap">XÓA</th>
              </tr>
            </thead>
            <motion.tbody layout className="divide-y divide-emerald-900/20">
              <AnimatePresence>
              {filteredPositions.map((pos) => {
                const priceDiff = pos.currentPrice - pos.averageCost;
                const diffVND = Math.round(priceDiff * 1000);
                return (
                  <motion.tr 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { duration: 0.2 }
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.005, zIndex: 10, position: "relative" }}
                  key={pos.id} 
                  className={clsx(
                    "transition-all duration-500",
                    pos.isHighlighted 
                      ? "bg-emerald-400/5 relative z-10 border-y border-emerald-400/30 shadow-[inset_0_0_20px_rgba(52,211,153,0.1),_0_0_15px_rgba(52,211,153,0.1)] outline outline-1 outline-emerald-400/20" 
                      : "hover:bg-emerald-900/10"
                  )}
                >
                  <td className={clsx("p-3 border-r align-top transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    <div className="flex gap-2">
                      {/* Controls */}
                      <div className="flex flex-col gap-1 justify-center pt-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={clsx(
                            "h-5 w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center",
                            pos.isHighlighted
                              ? "bg-emerald-900/60 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:bg-emerald-800/60"
                              : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500/50 hover:text-emerald-400"
                          )}
                          onClick={() => toggleHighlight(pos.id)}
                          title="Đánh dấu nổi bật"
                        >
                          <Star className={clsx("w-3 h-3 transition-all", pos.isHighlighted && "fill-emerald-400 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)] animate-pulse")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={clsx("h-5 w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center", pos.isHighlighted ? "bg-emerald-900/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-800/60" : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500 hover:text-emerald-300")}
                          onClick={() => movePosition(pos.id, 'up')}
                          disabled={positions.indexOf(pos) === 0}
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={clsx("h-5 w-5 p-0 border rounded disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center", pos.isHighlighted ? "bg-emerald-900/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-800/60" : "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-500/25 text-emerald-500 hover:text-emerald-300")}
                          onClick={() => movePosition(pos.id, 'down')}
                          disabled={positions.indexOf(pos) === positions.length - 1}
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2 flex-1">
                        <input
                          type="text"
                          className="w-full bg-black/60 border border-zinc-800 focus:border-zinc-655 rounded px-3 py-2 focus:outline-none text-[#e0e0e0] font-extrabold uppercase text-center transition-colors shadow-inner font-mono text-base md:text-lg lg:text-xl tracking-wide placeholder:opacity-50"
                          value={pos.symbol}
                          placeholder="MÃ CP"
                          onChange={(e) => updateSymbol(pos.id, e.target.value)}
                        />
                        {pos.symbol && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-7 text-[10px] bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all font-mono tracking-wider"
                            onClick={() => setActiveDashboardId(pos.id)}
                          >
                            <LayoutDashboard className="w-3 h-3 mr-1" />
                            CHI TIẾT
                          </Button>
                        )}
                        {pos.symbol && (pos.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 justify-center max-w-full">
                            {pos.tags?.map(t => (
                              <span 
                                key={t} 
                                className={`${getTagStyles(t)} text-[11px] md:text-xs px-2 py-0.5 rounded border font-mono font-semibold tracking-tight whitespace-nowrap`}
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
                  
                  {Array.from({ length: maxBuys }).map((_, i) => {
                    const buy = pos.buys[i];
                    return (
                      <td key={i} className={clsx("p-2 border-r align-top relative group transition-colors duration-500", pos.isHighlighted ? "bg-transparent border-emerald-400/30" : "bg-emerald-950/10 hover:bg-emerald-900/20 border-emerald-900/30")}>
                        {buy !== undefined ? (
                          <div className="relative z-10 w-full pt-1">
                            <input
                              type="number"
                              step="any"
                              className="w-full bg-black/60 border border-zinc-800 rounded px-3 py-2 text-[#e0e0e0] focus:outline-none focus:border-zinc-600 shadow-inner transition-colors font-mono text-center text-base md:text-lg lg:text-xl font-bold"
                              value={buy.price || ''}
                              placeholder="Nhập giá..."
                              onChange={(e) => updateBuy(pos.id, i, Number(e.target.value), buy.volume || 1000)}
                            />
                            {pos.buys.length > 1 && (
                              <button 
                                onClick={() => removeBuy(pos.id, i)}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 text-rose-400 bg-black/80 rounded-full p-0.5 border border-rose-500/50 hover:bg-rose-500/30 hover:text-rose-300 transition-all z-20 tech-glow shadow-md"
                                title="Xóa giao dịch"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="h-[46px] mt-1 flex items-center justify-center opacity-30 italic text-xs text-slate-400 border border-dashed border-emerald-900/40 rounded font-mono uppercase tracking-wider">
                            TRỐNG
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className={clsx("p-3 border-r text-center align-top pt-5 transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    {pos.buys.length < 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full bg-emerald-950/40 hover:bg-emerald-900 hover:text-emerald-300 text-emerald-500 border border-emerald-500/30 mx-auto transition-all tech-glow" 
                        onClick={() => addBuy(pos.id)}
                        title="Thêm lần mua"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </td>

                  <td className={clsx("p-3 border-r text-right align-top pt-4 whitespace-nowrap transition-colors duration-500", pos.isHighlighted ? "bg-emerald-400/5 border-emerald-400/30" : "bg-emerald-950/20 border-emerald-900/30")}>
                    <div className="text-base md:text-lg lg:text-xl font-bold font-mono text-emerald-50">
                      {formatStockPrice(pos.averageCost)}
                    </div>
                    <div className="text-[11px] mt-1 font-mono text-zinc-400/80 font-medium tracking-tight">
                      ~ {formatCurrency(Math.round(pos.averageCost * 1000))} VNĐ
                    </div>
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-4 transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap w-full">
                        <div className={clsx("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] shrink-0", pos.unrealizedPL >= 0 ? (isRedTheme ? "bg-[#10b981] text-[#10b981]" : "bg-emerald-500 text-emerald-500") : "bg-rose-500 text-rose-500")}></div>
                        <input
                          type="number"
                          step="any"
                          className={clsx(
                            "w-28 bg-black/60 border border-zinc-800/80 focus:border-zinc-700/80 rounded px-2 py-1 text-right font-extrabold font-mono text-base md:text-lg transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
                            pos.unrealizedPL >= 0 ? (isRedTheme ? "text-[#34d399]" : "text-emerald-400") : "text-rose-400"
                          )}
                          value={pos.currentPrice || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            updateMarketPrice(pos.symbol || '', val);
                          }}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400/80 font-medium tracking-tight">
                        {priceDiff > 0 ? (
                          <span className={isRedTheme ? "text-[#34d399]/85" : "text-emerald-400/85"}>
                            +{formatCurrency(diffVND)} VNĐ/CP
                          </span>
                        ) : priceDiff < 0 ? (
                          <span className="text-rose-400/85">
                            {formatCurrency(diffVND)} VNĐ/CP
                          </span>
                        ) : (
                          <span className="text-zinc-500/70">
                            0 VNĐ (bằng giá vốn)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-4 transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    <div className={clsx("font-extrabold text-base md:text-lg lg:text-xl font-mono drop-shadow-[0_0_5px_currentColor] whitespace-nowrap", pos.unrealizedPLPercent >= 0 ? (isRedTheme ? "text-[#34d399]" : "text-emerald-400") : "text-rose-400")}>
                      {pos.unrealizedPLPercent > 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                    </div>
                    <div className="mt-1 flex items-center justify-end">
                      {pos.unrealizedPLPercent > 0 ? (
                        <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-extrabold tracking-wider border whitespace-nowrap select-none", 
                          isRedTheme 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-[#34d399]" 
                            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        )}>
                          <span className="text-[9px]">▲</span> LÃI
                        </span>
                      ) : pos.unrealizedPLPercent < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-extrabold tracking-wider bg-rose-500/10 border border-rose-500/25 text-rose-400 whitespace-nowrap select-none">
                          <span className="text-[9px]">▼</span> LỖ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-extrabold tracking-wider bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 whitespace-nowrap select-none">
                          🟰 HOÀ VỐN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center align-top pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 mx-auto border hover:border-rose-500/30 border-transparent transition-all" 
                      onClick={() => removePosition(pos.id)}
                      title="Xóa mã"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
              </AnimatePresence>
              
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={maxBuys + 6} className="p-16 text-center text-slate-400 font-mono tracking-widest bg-emerald-950/5">
                    <div className="max-w-sm mx-auto space-y-4">
                      <p className="opacity-70 text-xs uppercase">
                        {positions.length === 0 
                          ? "Không có mã chứng khoán nào." 
                          : "Không có mã nào kết nối với nhãn được chọn."}
                      </p>
                      {positions.length === 0 ? (
                        <Button onClick={handleAddPosition} className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 text-white transition-all tech-glow uppercase text-[11px] px-8 py-4">
                          <Plus className="h-4 w-4 mr-2" />
                          THÊM MÃ ĐẦU TIÊN
                        </Button>
                      ) : (
                        <Button onClick={() => setSelectedTag('Tất cả')} className="bg-emerald-650/40 hover:bg-emerald-600 border border-emerald-500/55 text-white transition-all tech-glow uppercase text-[11px] px-6 py-2">
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
      
      <StockDashboardModal 
        positionId={activeDashboardId} 
        onClose={() => setActiveDashboardId(null)}
      />

      <AllocationModal 
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
      />
    </div>
  );
}
