import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, FileText } from 'lucide-react';
import { Card } from './ui/core';

interface StockDashboardModalProps {
  positionId: string | null;
  onClose: () => void;
}

export function StockDashboardModal({ positionId, onClose }: StockDashboardModalProps) {
  const position = useStore(state => state.positions.find(p => p.id === positionId));
  const updateDashboardInfo = useStore(state => state.updateDashboardInfo);

  if (!position) return null;

  const info = position.dashboardInfo || {};

  const handleUpdateNotes = (value: string) => {
    updateDashboardInfo(position.id, { customNotes: value });
  };

  return (
    <AnimatePresence>
      {positionId && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: 10, y: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, rotateX: -10, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[700px] h-fit max-h-[90vh] glass-panel border border-emerald-500/30 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] z-50 flex flex-col overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 pointer-events-none" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/40 bg-black/40 relative z-10">
              <div>
                <h2 className="text-3xl font-bold font-display text-white" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
                  {position.symbol || "Unknown"} <span className="text-emerald-500 font-sans tracking-tight text-xl ml-1">CHI TIẾT</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 border border-transparent transition-all"
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0c0c0e]/80 relative z-10 backdrop-blur-md">
              {/* Custom Notes */}
              <Card className="p-4 border-emerald-500/40 bg-black/90 group shadow-[0_0_20px_rgba(16,185,129,0.1)] glass-panel relative overflow-hidden flex flex-col min-h-[350px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/10 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 text-emerald-400 font-mono tracking-wider text-xs relative z-10">
                  <FileText className="w-4 h-4" />
                  <span>TRANG GHI CHÚ</span>
                </div>
                <textarea 
                  value={info.customNotes || ''}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng, nhận định, hoặc kế hoạch giao dịch của bạn tại đây..."
                  className="w-full flex-1 bg-black border border-emerald-500/30 rounded-lg p-5 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 shadow-inner resize-none transition-all custom-scrollbar relative z-10 font-mono placeholder-emerald-900/50 leading-relaxed"
                />
              </Card>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
