import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useDerivedPortfolio } from '../store/useStore';
import { X, Camera, Copy, Check, Sun, Moon, Sparkles, Smartphone, Monitor, ShieldCheck, Activity } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const positions = useStore(state => state.positions);
  const brandSettings = useStore(state => state.brandSettings);
  const boardTitle = useStore(state => state.boardTitle);
  const lastUpdated = useStore(state => state.lastUpdated);
  const portfolioStockWeight = useStore(state => state.portfolioStockWeight);
  const derived = useDerivedPortfolio();

  const [exportTheme, setExportTheme] = useState<'light' | 'contrast' | 'cyber'>('light');
  const [exportDensity, setExportDensity] = useState<'compact' | 'standard'>('compact');
  const [showSummaryCards, setShowSummaryCards] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const previewCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const prefix = brandSettings?.appNamePrefix || 'Portfolio';
  const suffix = brandSettings?.appNameSuffix || 'OS';
  const logoIcon = brandSettings?.logoIcon || 'LayoutDashboard';
  const SelectedLogoIcon = (Icons as any)[logoIcon] || Icons.LayoutDashboard;

  const maxBuys = Math.max(1, ...positions.map(p => p.buys.length));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const formatStockPrice = (val: number) => {
    return val > 0 ? (val < 10 ? val.toFixed(2) : (val % 1 === 0 ? val.toString() : val.toFixed(2))) : '-';
  };

  const handleDownload = async () => {
    if (!previewCardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const el = previewCardRef.current;
      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 3, // Ultra crisp resolution for mobile zoom & social messaging apps
        cacheBust: true,
      });

      const link = document.createElement('a');
      const dateSlug = new Date().toISOString().slice(0, 10);
      link.download = `bao-cao-danh-muc-${dateSlug}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!previewCardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setCopyError(null);
      await new Promise(resolve => setTimeout(resolve, 100));

      const el = previewCardRef.current;
      const blob = await toBlob(el, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        // Fallback to download if clipboard API is restricted
        handleDownload();
      }
    } catch (err) {
      console.error('Lỗi khi copy ảnh:', err);
      setCopyError('Trình duyệt chặn sao chép trực tiếp. Hãy nhấn "TẢI ẢNH PNG".');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Xuất Báo Cáo Cho Khách Hàng
                </h3>
                <p className="text-xs text-zinc-400">
                  Tối ưu độ nét cao 3X, loại bỏ nút thừa, chống nhòe khi gửi qua Zalo / Messenger
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="px-6 py-3.5 bg-zinc-900/30 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
            {/* Theme Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Giao diện:
              </span>
              <div className="inline-flex rounded-lg bg-black/60 p-1 border border-zinc-800">
                <button
                  onClick={() => setExportTheme('light')}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                    exportTheme === 'light'
                      ? "bg-white text-zinc-900 font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Sáng Báo Cáo (Khuyên dùng)
                </button>
                <button
                  onClick={() => setExportTheme('contrast')}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                    exportTheme === 'contrast'
                      ? "bg-zinc-800 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  Tối Tương Phản Cao
                </button>
                <button
                  onClick={() => setExportTheme('cyber')}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                    exportTheme === 'cyber'
                      ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Cyber Dark
                </button>
              </div>
            </div>

            {/* Density Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Mật độ cột:
              </span>
              <div className="inline-flex rounded-lg bg-black/60 p-1 border border-zinc-800">
                <button
                  onClick={() => setExportDensity('compact')}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                    exportDensity === 'compact'
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Thu Gọn (Dễ xem trên ĐT)
                </button>
                <button
                  onClick={() => setExportDensity('standard')}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                    exportDensity === 'standard'
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Chuẩn Rộng
                </button>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex items-center gap-4 text-xs text-zinc-300">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSummaryCards}
                  onChange={(e) => setShowSummaryCards(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 accent-emerald-500"
                />
                Thẻ tóm tắt tổng
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTags}
                  onChange={(e) => setShowTags(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 accent-emerald-500"
                />
                Nhãn phân loại
              </label>
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/80 flex justify-center items-start">
            <div className="w-full max-w-4xl overflow-x-auto">
              {/* THE CAPTURABLE REPORT ELEMENT */}
              <div
                ref={previewCardRef}
                className={clsx(
                  "p-6 sm:p-8 rounded-2xl transition-all duration-300",
                  exportTheme === 'light' && "bg-white text-slate-900 border border-slate-200 shadow-xl",
                  exportTheme === 'contrast' && "bg-black text-white border border-zinc-700 shadow-2xl",
                  exportTheme === 'cyber' && "bg-[#06110d] text-slate-200 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                )}
                style={{ minWidth: exportDensity === 'compact' ? '680px' : '820px' }}
              >
                {/* Report Header & Watermark */}
                <div className={clsx(
                  "flex items-center justify-between pb-5 border-b mb-6",
                  exportTheme === 'light' && "border-slate-200",
                  exportTheme === 'contrast' && "border-zinc-800",
                  exportTheme === 'cyber' && "border-emerald-900/40"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md",
                      exportTheme === 'light' && "bg-emerald-600 text-white",
                      exportTheme === 'contrast' && "bg-white text-black",
                      exportTheme === 'cyber' && "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    )}>
                      <SelectedLogoIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={clsx(
                        "text-xl font-bold tracking-tight uppercase",
                        exportTheme === 'light' && "text-slate-900",
                        exportTheme === 'contrast' && "text-white",
                        exportTheme === 'cyber' && "text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      )}>
                        {boardTitle || 'BÁO CÁO DANH MỤC ĐẦU TƯ'}
                      </h2>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className={clsx(
                          "font-semibold",
                          exportTheme === 'light' && "text-emerald-700",
                          exportTheme === 'contrast' && "text-emerald-400",
                          exportTheme === 'cyber' && "text-emerald-400 font-mono"
                        )}>
                          {prefix}{suffix}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className={clsx(
                          exportTheme === 'light' && "text-slate-500",
                          exportTheme === 'contrast' && "text-zinc-400",
                          exportTheme === 'cyber' && "text-emerald-500/70"
                        )}>
                          Báo cáo tư vấn & quản lý tài sản
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={clsx(
                      "text-xs font-semibold px-2.5 py-1 rounded-md inline-block",
                      exportTheme === 'light' && "bg-slate-100 text-slate-700 border border-slate-200",
                      exportTheme === 'contrast' && "bg-zinc-900 text-zinc-300 border border-zinc-800",
                      exportTheme === 'cyber' && "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                    )}>
                      Thời gian: {lastUpdated || new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Summary Metrics Cards (if enabled) */}
                {showSummaryCards && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className={clsx(
                      "p-3.5 rounded-xl border text-center",
                      exportTheme === 'light' && "bg-slate-50 border-slate-200",
                      exportTheme === 'contrast' && "bg-zinc-950 border-zinc-800",
                      exportTheme === 'cyber' && "bg-black/40 border-emerald-900/30"
                    )}>
                      <div className={clsx(
                        "text-[11px] font-bold uppercase tracking-wider mb-1",
                        exportTheme === 'light' && "text-slate-500",
                        exportTheme === 'contrast' && "text-zinc-400",
                        exportTheme === 'cyber' && "text-emerald-400/80 font-mono"
                      )}>
                        Tỷ Trọng Cổ Phiếu
                      </div>
                      <div className={clsx(
                        "text-xl sm:text-2xl font-bold font-mono",
                        exportTheme === 'light' && "text-slate-900",
                        exportTheme === 'contrast' && "text-white",
                        exportTheme === 'cyber' && "text-white"
                      )}>
                        {portfolioStockWeight}%
                      </div>
                    </div>

                    <div className={clsx(
                      "p-3.5 rounded-xl border text-center",
                      exportTheme === 'light' && "bg-slate-50 border-slate-200",
                      exportTheme === 'contrast' && "bg-zinc-950 border-zinc-800",
                      exportTheme === 'cyber' && "bg-black/40 border-emerald-900/30"
                    )}>
                      <div className={clsx(
                        "text-[11px] font-bold uppercase tracking-wider mb-1",
                        exportTheme === 'light' && "text-slate-500",
                        exportTheme === 'contrast' && "text-zinc-400",
                        exportTheme === 'cyber' && "text-emerald-400/80 font-mono"
                      )}>
                        Tỷ Trọng Tiền Mặt
                      </div>
                      <div className={clsx(
                        "text-xl sm:text-2xl font-bold font-mono",
                        exportTheme === 'light' && "text-slate-900",
                        exportTheme === 'contrast' && "text-white",
                        exportTheme === 'cyber' && "text-white"
                      )}>
                        {100 - portfolioStockWeight}%
                      </div>
                    </div>

                    <div className={clsx(
                      "p-3.5 rounded-xl border text-center",
                      exportTheme === 'light' && "bg-slate-50 border-slate-200",
                      exportTheme === 'contrast' && "bg-zinc-950 border-zinc-800",
                      exportTheme === 'cyber' && "bg-black/40 border-emerald-900/30"
                    )}>
                      <div className={clsx(
                        "text-[11px] font-bold uppercase tracking-wider mb-1",
                        exportTheme === 'light' && "text-slate-500",
                        exportTheme === 'contrast' && "text-zinc-400",
                        exportTheme === 'cyber' && "text-emerald-400/80 font-mono"
                      )}>
                        % Lãi/Lỗ Danh Mục
                      </div>
                      <div className={clsx(
                        "text-xl sm:text-2xl font-black font-mono",
                        derived.portfolioPLPercent >= 0
                          ? (exportTheme === 'light' ? "text-emerald-600" : "text-emerald-400")
                          : (exportTheme === 'light' ? "text-rose-600" : "text-rose-400")
                      )}>
                        {derived.portfolioPLPercent > 0 ? '+' : ''}{derived.portfolioPLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Clean Table for Customer */}
                <div className={clsx(
                  "rounded-xl overflow-hidden border",
                  exportTheme === 'light' && "border-slate-200 bg-white",
                  exportTheme === 'contrast' && "border-zinc-800 bg-zinc-950",
                  exportTheme === 'cyber' && "border-emerald-900/40 bg-black/60"
                )}>
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className={clsx(
                        "border-b uppercase font-bold tracking-wider",
                        exportTheme === 'light' && "bg-slate-100 text-slate-700 border-slate-200",
                        exportTheme === 'contrast' && "bg-zinc-900 text-zinc-300 border-zinc-800",
                        exportTheme === 'cyber' && "bg-black/80 text-[#e0e0e0] border-zinc-800"
                      )}>
                        <th className={clsx(
                          "border-r text-center font-extrabold whitespace-nowrap",
                          exportDensity === 'compact' ? "p-2.5 w-32" : "p-3.5 w-40",
                          exportTheme === 'light' ? "border-slate-200" : "border-zinc-800"
                        )}>
                          MÃ CP
                        </th>
                        {Array.from({ length: maxBuys }).map((_, i) => (
                          <th
                            key={i}
                            className={clsx(
                              "border-r text-center font-bold whitespace-nowrap",
                              exportDensity === 'compact' ? "p-2.5" : "p-3.5",
                              exportTheme === 'light' ? "border-slate-200 bg-slate-50/70" : "border-zinc-800"
                            )}
                          >
                            MUA {i + 1}
                          </th>
                        ))}
                        <th className={clsx(
                          "border-r text-right font-bold whitespace-nowrap",
                          exportDensity === 'compact' ? "p-2.5 w-36" : "p-3.5 w-44",
                          exportTheme === 'light' ? "border-slate-200" : "border-zinc-800"
                        )}>
                          GIÁ VỐN TB
                        </th>
                        <th className={clsx(
                          "border-r text-right font-bold whitespace-nowrap",
                          exportDensity === 'compact' ? "p-2.5 w-36" : "p-3.5 w-44",
                          exportTheme === 'light' ? "border-slate-200" : "border-zinc-800"
                        )}>
                          GIÁ HIỆN TẠI
                        </th>
                        <th className={clsx(
                          "text-right font-bold whitespace-nowrap",
                          exportDensity === 'compact' ? "p-2.5 w-36" : "p-3.5 w-44"
                        )}>
                          % LÃI/LỖ
                        </th>
                      </tr>
                    </thead>
                    <tbody className={clsx(
                      "divide-y font-mono",
                      exportTheme === 'light' && "divide-slate-200",
                      exportTheme === 'contrast' && "divide-zinc-800",
                      exportTheme === 'cyber' && "divide-emerald-900/20"
                    )}>
                      {derived.positions.map((pos) => {
                        const priceDiff = pos.currentPrice - pos.averageCost;
                        const diffVND = Math.round(priceDiff * 1000);
                        const isProfit = pos.unrealizedPLPercent >= 0;

                        return (
                          <tr
                            key={pos.id}
                            className={clsx(
                              "transition-colors",
                              exportTheme === 'light' && "hover:bg-slate-50",
                              exportTheme === 'contrast' && "hover:bg-zinc-900/40",
                              exportTheme === 'cyber' && "hover:bg-emerald-950/20"
                            )}
                          >
                            {/* Symbol & Tags */}
                            <td className={clsx(
                              "border-r align-middle text-center",
                              exportDensity === 'compact' ? "p-2" : "p-3",
                              exportTheme === 'light' ? "border-slate-200 bg-slate-50/50" : "border-zinc-800"
                            )}>
                              <div className={clsx(
                                "font-extrabold text-base tracking-wider",
                                exportTheme === 'light' && "text-slate-900 font-sans",
                                exportTheme === 'contrast' && "text-white font-sans",
                                exportTheme === 'cyber' && "text-white"
                              )}>
                                {pos.symbol || '---'}
                              </div>
                              {showTags && pos.tags && pos.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-center mt-1">
                                  {pos.tags.map(t => (
                                    <span
                                      key={t}
                                      className={clsx(
                                        "text-[9px] px-1.5 py-0.2 rounded font-semibold whitespace-nowrap",
                                        exportTheme === 'light' ? "bg-slate-200/80 text-slate-700" : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                      )}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Buy prices */}
                            {Array.from({ length: maxBuys }).map((_, i) => {
                              const buy = pos.buys[i];
                              return (
                                <td
                                  key={i}
                                  className={clsx(
                                    "border-r text-center align-middle font-bold",
                                    exportDensity === 'compact' ? "p-2" : "p-3",
                                    exportTheme === 'light' ? "border-slate-200 text-slate-800" : "border-zinc-800 text-zinc-200"
                                  )}
                                >
                                  {buy && buy.price > 0 ? (
                                    <span className="text-sm sm:text-base font-bold">{formatStockPrice(buy.price)}</span>
                                  ) : (
                                    <span className="text-xs opacity-30 italic">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Avg Cost */}
                            <td className={clsx(
                              "border-r text-right align-middle whitespace-nowrap",
                              exportDensity === 'compact' ? "p-2" : "p-3",
                              exportTheme === 'light' ? "border-slate-200" : "border-zinc-800"
                            )}>
                              <div className={clsx(
                                "text-sm sm:text-base font-bold",
                                exportTheme === 'light' ? "text-slate-900" : "text-white"
                              )}>
                                {formatStockPrice(pos.averageCost)}
                              </div>
                              <div className={clsx(
                                "text-[10px] font-normal",
                                exportTheme === 'light' ? "text-slate-500" : "text-zinc-400"
                              )}>
                                {formatCurrency(Math.round(pos.averageCost * 1000))} đ
                              </div>
                            </td>

                            {/* Current Price */}
                            <td className={clsx(
                              "border-r text-right align-middle whitespace-nowrap",
                              exportDensity === 'compact' ? "p-2" : "p-3",
                              exportTheme === 'light' ? "border-slate-200" : "border-zinc-800"
                            )}>
                              <div className={clsx(
                                "text-sm sm:text-base font-bold",
                                isProfit
                                  ? (exportTheme === 'light' ? "text-emerald-700" : "text-emerald-400")
                                  : (exportTheme === 'light' ? "text-rose-600" : "text-rose-400")
                              )}>
                                {formatStockPrice(pos.currentPrice)}
                              </div>
                              <div className={clsx(
                                "text-[10px] font-medium",
                                isProfit
                                  ? (exportTheme === 'light' ? "text-emerald-700/80" : "text-emerald-400/80")
                                  : (exportTheme === 'light' ? "text-rose-600/80" : "text-rose-400/80")
                              )}>
                                {diffVND > 0 ? `+${formatCurrency(diffVND)}` : formatCurrency(diffVND)} đ
                              </div>
                            </td>

                            {/* P/L % */}
                            <td className={clsx(
                              "text-right align-middle whitespace-nowrap",
                              exportDensity === 'compact' ? "p-2" : "p-3"
                            )}>
                              <div className={clsx(
                                "text-sm sm:text-base font-extrabold",
                                isProfit
                                  ? (exportTheme === 'light' ? "text-emerald-700" : "text-emerald-400")
                                  : (exportTheme === 'light' ? "text-rose-600" : "text-rose-400")
                              )}>
                                {pos.unrealizedPLPercent > 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                              </div>
                              <div className="mt-0.5">
                                {isProfit ? (
                                  <span className={clsx(
                                    "inline-block px-1.5 py-0.2 rounded text-[9px] font-sans font-bold",
                                    exportTheme === 'light' ? "bg-emerald-100 text-emerald-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                  )}>
                                    ▲ LÃI
                                  </span>
                                ) : (
                                  <span className={clsx(
                                    "inline-block px-1.5 py-0.2 rounded text-[9px] font-sans font-bold",
                                    exportTheme === 'light' ? "bg-rose-100 text-rose-800" : "bg-rose-950 text-rose-300 border border-rose-800/60"
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

                {/* Footer Watermark */}
                <div className={clsx(
                  "mt-5 pt-3 border-t flex items-center justify-between text-[11px]",
                  exportTheme === 'light' ? "border-slate-200 text-slate-500" : "border-zinc-800 text-zinc-500"
                )}>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Dữ liệu được cập nhật chuẩn xác theo biến động thị trường chứng khoán Việt Nam</span>
                  </div>
                  <div className="font-mono font-semibold">
                    {prefix}{suffix} • Portfolio Manager
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-400 text-center sm:text-left">
              {copyError ? (
                <span className="text-rose-400">{copyError}</span>
              ) : (
                <span>Mẹo: Bạn có thể sao chép nhanh rồi dán thẳng (Ctrl+V) vào Zalo gửi cho khách.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleCopyToClipboard}
                disabled={isExporting}
                className={clsx(
                  "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                  isCopied
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                )}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    ĐÃ SAO CHÉP ẢNH!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    SAO CHÉP ẢNH
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {isExporting ? "ĐANG XUẤT..." : "TẢI ẢNH PNG (3X SIÊU NÉT)"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
