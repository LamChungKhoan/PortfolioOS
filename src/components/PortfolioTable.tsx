import React, { useState, useEffect, useRef } from 'react';
import { useStore, useDerivedPortfolio } from '../store/useStore';
import { Card, Button } from './ui/core';
import { Plus, Trash2, DollarSign, X, Activity, LayoutDashboard, Zap, ChevronUp, ChevronDown, Star, Camera, PieChart } from 'lucide-react';
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

export function PortfolioTable() {
  const { positions, cashBalance, totalNav, totalUnrealizedPL } = useDerivedPortfolio();
  
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
                className="bg-emerald-950/40 border border-emerald-500/50 rounded px-2 py-0.5 text-3xl font-bold font-display text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-inner w-full min-w-[300px] max-w-md uppercase"
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
          <p className="text-emerald-500/70 mt-1 font-mono text-xs uppercase tracking-widest relative z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Theo Dõi Danh Mục Đầu Tư V1.0
          </p>
        </div>
        <div className={clsx("flex flex-wrap gap-3 relative z-10 transition-opacity justify-end", isCapturing && "opacity-0")}>
          <Button variant="outline" size="sm" className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" onClick={handleCapture} disabled={isCapturing}>
            <Camera className={clsx("h-4 w-4 mr-2 text-emerald-400", isCapturing && "animate-pulse")} />
            XUẤT BÁO CÁO
          </Button>
          <Button variant="outline" size="sm" className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" onClick={() => setShowAllocationModal(true)}>
            <PieChart className="h-4 w-4 mr-2 text-emerald-400" />
            BIỂU ĐỒ TÀI SẢN
          </Button>
          <Button variant="outline" size="sm" className="bg-emerald-950/30 hover:bg-emerald-900/60 hover:text-emerald-300 border-emerald-500/40 tech-glow transition-all" onClick={() => {
            setIsEditingCash(!isEditingCash);
            setCashInput(cashBalance.toString());
          }}>
            <DollarSign className="h-4 w-4 mr-2 text-emerald-400" />
            CẬP NHẬT VỐN
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
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">TỔNG TÀI SẢN (NAV)</div>
          <div className="text-3xl font-bold text-white font-mono relative z-10 text-shadow-sm">{formatCurrency(totalNav)} ₫</div>
        </Card>
        <Card className="p-5 border-emerald-500/30 bg-black/40 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">SỐ DƯ TIỀN MẶT</div>
          <div className="text-3xl font-bold text-white font-mono relative z-10 text-shadow-sm">{formatCurrency(cashBalance)} ₫</div>
        </Card>
        <Card className="p-5 border-emerald-500/30 bg-black/40 glass-panel shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
          <div className="text-emerald-400 text-sm mb-1 uppercase tracking-widest font-mono text-[11px] relative z-10">TỔNG LÃI/LỖ</div>
          <div className={clsx("text-3xl font-bold font-mono relative z-10", totalUnrealizedPL >= 0 ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]")}>
            {totalUnrealizedPL > 0 ? '+' : ''}{formatCurrency(totalUnrealizedPL)} ₫
          </div>
        </Card>
      </div>

      {isEditingCash && (
        <Card className="p-4 border-emerald-500/40 bg-emerald-950/20 glass-panel tech-glow">
          <form onSubmit={handleCashSubmit} className="flex gap-4 items-end">
            <div className="space-y-1 flex-1 max-w-sm">
              <label className="text-[11px] font-bold font-mono uppercase text-emerald-400 tracking-widest">LIQUID INPUT (VND)</label>
              <input
                type="number"
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                className="w-full bg-black/60 border border-emerald-500/50 rounded p-2 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-inner font-mono"
                placeholder="Nhập số tiền..."
              />
            </div>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              COMMIT
            </Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden border-emerald-900/40 glass-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-black/60 text-emerald-400/80 border-b border-emerald-900/50 font-mono">
              <tr>
                <th className="p-3 border-r border-emerald-900/30 w-44 uppercase text-xs md:text-sm tracking-wider font-semibold text-center flex-shrink-0 min-w-[170px] whitespace-nowrap">MÃ CP</th>
                {Array.from({ length: maxBuys }).map((_, i) => (
                  <th key={i} className="p-3 border-r border-emerald-900/30 min-w-[180px] uppercase text-xs md:text-sm tracking-wider font-semibold text-center bg-emerald-950/10 whitespace-nowrap">
                    GIAO DỊCH {i + 1}
                  </th>
                ))}
                <th className="p-3 border-r border-emerald-900/30 w-24 text-center uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[85px] whitespace-nowrap">THÊM</th>
                <th className="p-3 border-r border-emerald-900/30 w-28 text-right uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[110px] whitespace-nowrap">TỔNG KL</th>
                <th className="p-3 border-r border-emerald-900/30 w-44 text-right uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[170px] whitespace-nowrap">GIÁ VỐN TRUNG BÌNH</th>
                <th className="p-3 border-r border-emerald-900/30 w-44 text-right uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[200px] whitespace-nowrap">GIÁ TRỊ THỊ TRƯỜNG</th>
                <th className="p-3 border-r border-emerald-900/30 w-40 text-right uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[150px] text-emerald-300">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <Activity className="w-3.5 h-3.5" /> GIÁ HIỆN TẠI
                  </div>
                </th>
                <th className="p-3 border-r border-emerald-900/30 w-44 text-right uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[180px] whitespace-nowrap">LÃI/LỖ</th>
                <th className="p-3 w-16 text-center uppercase text-xs md:text-sm tracking-wider font-semibold min-w-[65px] whitespace-nowrap">XÓA</th>
              </tr>
            </thead>
            <motion.tbody layout className="divide-y divide-emerald-900/20">
              <AnimatePresence>
              {positions.map((pos) => (
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
                          className="w-full bg-black/60 border border-emerald-500/30 focus:border-emerald-400 rounded px-2 py-1.5 focus:outline-none text-emerald-100 font-bold uppercase text-center transition-colors shadow-inner font-mono text-lg"
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
                      </div>
                    </div>
                  </td>
                  
                  {Array.from({ length: maxBuys }).map((_, i) => {
                    const buy = pos.buys[i];
                    return (
                      <td key={i} className={clsx("p-2 border-r align-top relative group transition-colors duration-500", pos.isHighlighted ? "bg-transparent border-emerald-400/30" : "bg-emerald-950/10 hover:bg-emerald-900/20 border-emerald-900/30")}>
                        {buy !== undefined ? (
                          <div className="flex gap-2 relative z-10">
                            <div className="flex-1">
                              <div className="text-[9px] text-emerald-500 mb-0.5 ml-1 select-none font-mono">GIÁ</div>
                              <input
                                type="number"
                                step="any"
                                className="w-full bg-black/60 border border-emerald-500/30 rounded px-2 py-1.5 text-emerald-50 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-inner transition-colors font-mono"
                                value={buy.price || ''}
                                placeholder="0"
                                onChange={(e) => updateBuy(pos.id, i, Number(e.target.value), buy.volume)}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-[9px] text-emerald-500 mb-0.5 ml-1 select-none font-mono">KL</div>
                              <input
                                type="number"
                                className="w-full bg-black/60 border border-emerald-500/30 rounded px-2 py-1.5 text-emerald-50 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-inner transition-colors font-mono"
                                value={buy.volume || ''}
                                placeholder="0"
                                onChange={(e) => updateBuy(pos.id, i, buy.price, Number(e.target.value))}
                              />
                            </div>
                            {pos.buys.length > 1 && (
                              <button 
                                onClick={() => removeBuy(pos.id, i)}
                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 text-rose-400 bg-black/80 rounded-full p-0.5 border border-rose-500/50 hover:bg-rose-500/30 hover:text-rose-300 transition-all z-20 tech-glow"
                                title="Xóa giao dịch"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 mt-3.5 flex items-center justify-center opacity-30 italic text-[10px] text-emerald-700 border border-dashed border-emerald-900/50 rounded font-mono">
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

                  <td className={clsx("p-3 border-r text-right align-top pt-5 text-sm md:text-base font-semibold text-emerald-100 font-mono whitespace-nowrap transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    {formatCurrency(pos.totalVolume)}
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-5 text-sm md:text-base font-semibold text-emerald-100 font-mono whitespace-nowrap transition-colors duration-500", pos.isHighlighted ? "bg-emerald-400/5 border-emerald-400/30" : "bg-emerald-950/20 border-emerald-900/30")}>
                    {formatStockPrice(pos.averageCost)}
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-5 font-bold text-sm md:text-base text-emerald-50 font-mono whitespace-nowrap transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    {formatCurrency(Math.round(pos.marketValue))}&nbsp;VNĐ
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-5 transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <div className={clsx("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", pos.unrealizedPL >= 0 ? "bg-emerald-500 text-emerald-500" : "bg-rose-500 text-rose-500")}></div>
                      <span className={clsx("font-bold font-mono text-sm md:text-base transition-colors drop-shadow-sm", pos.unrealizedPL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {formatStockPrice(pos.currentPrice)}
                      </span>
                    </div>
                  </td>
                  <td className={clsx("p-3 border-r text-right align-top pt-4 whitespace-nowrap transition-colors duration-500", pos.isHighlighted ? "border-emerald-400/30" : "border-emerald-900/30")}>
                    <div className={clsx("font-bold text-sm md:text-base font-mono drop-shadow-[0_0_5px_currentColor] whitespace-nowrap", pos.unrealizedPL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {pos.unrealizedPL > 0 ? '+' : ''}{formatCurrency(Math.round(pos.unrealizedPL))}&nbsp;VNĐ
                    </div>
                    <div className={clsx("text-xs md:text-sm mt-1 font-mono font-semibold drop-shadow-sm whitespace-nowrap", pos.unrealizedPLPercent >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>
                      {pos.unrealizedPLPercent > 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
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
              ))}
              </AnimatePresence>
              
              {positions.length === 0 && (
                <tr>
                  <td colSpan={maxBuys + 8} className="p-16 text-center text-emerald-600 font-mono tracking-widest bg-emerald-950/5">
                    <div className="max-w-sm mx-auto space-y-4">
                      <p className="opacity-70 text-xs uppercase">Không có mã chứng khoán nào.</p>
                      <Button onClick={handleAddPosition} className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 text-white transition-all tech-glow uppercase text-[11px] px-8 py-4">
                        <Plus className="h-4 w-4 mr-2" />
                        THÊM MÃ ĐẦU TIÊN
                      </Button>
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
