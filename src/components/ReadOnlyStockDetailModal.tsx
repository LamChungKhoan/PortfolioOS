import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Tags, MessageSquare } from 'lucide-react';
import { PortfolioPosition } from '../store/useStore';

interface ReadOnlyStockDetailModalProps {
  position: PortfolioPosition | null;
  onClose: () => void;
}

export const getTagStyles = (tag: string) => {
  const t = tag.toLowerCase().trim();
  if (t.includes('ngân hàng') || t.includes('vcb') || t.includes('acb')) {
    return 'bg-violet-950/45 border-violet-500/45 text-violet-300';
  }
  if (t.includes('thép') || t.includes('hpg')) {
    return 'bg-slate-900/50 border-slate-400/45 text-slate-300';
  }
  if (t.includes('bất động sản') || t.includes('bđs')) {
    return 'bg-amber-950/45 border-amber-500/45 text-amber-300';
  }
  if (t.includes('công nghệ') || t.includes('fpt')) {
    return 'bg-cyan-950/45 border-cyan-500/45 text-cyan-300';
  }
  if (t.includes('chứng khoán') || t.includes('vnd') || t.includes('ssi')) {
    return 'bg-blue-950/45 border-blue-500/45 text-blue-300';
  }
  if (t.includes('dài hạn') || t.includes('đầu tư dài hạn')) {
    return 'bg-emerald-950/45 border-emerald-500/45 text-emerald-300';
  }
  if (t.includes('lướt sóng') || t.includes('t+')) {
    return 'bg-rose-950/45 border-rose-500/45 text-rose-300';
  }
  if (t.includes('tích sản')) {
    return 'bg-yellow-950/45 border-yellow-500/45 text-yellow-300';
  }
  if (t.includes('trung hạn')) {
    return 'bg-indigo-950/45 border-indigo-500/45 text-indigo-300';
  }
  return 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400';
};

export function ReadOnlyStockDetailModal({ position, onClose }: ReadOnlyStockDetailModalProps) {
  if (!position) return null;

  const info = position.dashboardInfo || {};
  const hasNotes = Boolean(info.customNotes || info.catalyst);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-[#0c0c0e] border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/40 bg-black/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-display text-white tracking-wide">{position.symbol}</span>
              <span className="text-xs text-emerald-400 font-mono font-bold tracking-wider uppercase">/ THÔNG TIN & NHẬN ĐỊNH</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/50 transition-all"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Tags & Categories */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-2.5">
                <Tags className="w-3.5 h-3.5" />
                <span>PHÂN LOẠI DANH MỤC & CHIẾN LƯỢC:</span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-black/60 border border-emerald-900/30 min-h-11 items-center">
                {(position.tags && position.tags.length > 0) ? (
                  position.tags.map((t, idx) => (
                    <span 
                      key={idx} 
                      className={`${getTagStyles(t)} text-xs px-2.5 py-1 rounded-md border font-mono font-semibold shadow-sm`}
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic font-mono">Chưa gắn nhãn phân loại</span>
                )}
              </div>
            </div>

            {/* Notes / Analysis */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider mb-2.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>NHẬN ĐỊNH & GHI CHÚ TỪ MÔI GIỚI:</span>
              </div>

              {hasNotes ? (
                <div className="p-4 rounded-lg bg-black/80 border border-zinc-800 text-zinc-200 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap shadow-inner min-h-[120px]">
                  {info.customNotes || info.catalyst}
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-black/40 border border-zinc-800/80 text-center text-zinc-500 font-mono text-xs italic">
                  Chưa có ghi chú nhận định riêng cho mã {position.symbol}.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
