import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, FileText, Tags } from 'lucide-react';
import { Card } from './ui/core';

interface StockDashboardModalProps {
  positionId: string | null;
  onClose: () => void;
}

const presetIndustries = [
  'Ngân hàng', 'Thép', 'Bất động sản', 'Chứng khoán', 'Bán lẻ', 'Dầu khí',
  'Công nghệ', 'Năng lượng', 'Đầu tư công', 'Thủy sản', 'Nông nghiệp', 'Cảng biển'
];

const presetStrategies = [
  'Đầu tư dài hạn', 'Lướt sóng T+', 'Tích sản', 'Trung hạn', 'Đầu cơ', 'Cổ tức'
];

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

export function StockDashboardModal({ positionId, onClose }: StockDashboardModalProps) {
  const position = useStore(state => state.positions.find(p => p.id === positionId));
  const updateDashboardInfo = useStore(state => state.updateDashboardInfo);
  const addTag = useStore(state => state.addTag);
  const removeTag = useStore(state => state.removeTag);

  const [customTagInput, setCustomTagInput] = useState('');

  if (!position) return null;

  const info = position.dashboardInfo || {};

  const handleUpdateNotes = (value: string) => {
    updateDashboardInfo(position.id, { customNotes: value });
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag) {
      addTag(position.id, tag);
      setCustomTagInput('');
    }
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
                  {position.symbol || "Chưa Đặt Mã"} <span className="text-emerald-400 font-sans tracking-tight text-xl ml-1">CHI TIẾT</span>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0c0c0e]/80 relative z-10 backdrop-blur-md max-h-[75vh]">
              
              {/* Category tags card */}
              <Card className="p-4 md:p-5 border-emerald-500/30 bg-black/90 group shadow-[0_0_20px_rgba(16,185,129,0.05)] glass-panel relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/10 pointer-events-none" />
                <div className="flex items-center gap-2 mb-4 text-emerald-400 font-mono tracking-wider text-xs relative z-10 font-bold">
                  <Tags className="w-4 h-4 text-emerald-400" />
                  <span>PHÂN LOẠI DANH MỤC & CHIẾN LƯỢC QUẢN TRỊ</span>
                </div>

                {/* Show Current Active Tags */}
                <div className="mb-5 relative z-10">
                  <div className="text-[10px] font-bold font-mono text-emerald-500/50 mb-2 uppercase tracking-wide">Nhãn Đã Gắn Cho Mã {position.symbol || "Này"}:</div>
                  <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-lg bg-black/60 border border-emerald-900/30">
                    {(position.tags || []).length === 0 ? (
                      <span className="text-xs text-slate-400/80 italic font-mono pt-1">Chưa có nhãn phân loại nào... Hãy chọn nhãn bên dưới hoặc tạo nhãn mới.</span>
                    ) : (
                      position.tags?.map(t => (
                        <span 
                          key={t}
                          className={`${getTagStyles(t)} text-xs px-2.5 py-1 rounded-md border font-mono font-medium flex items-center gap-1.5 shadow-sm group hover:scale-105 transition-transform`}
                        >
                          #{t}
                          <button 
                            onClick={() => removeTag(position.id, t)}
                            className="hover:bg-rose-500/25 text-inherit hover:text-rose-450 w-4 h-4 rounded-full flex items-center justify-center transition-all opacity-50 group-hover:opacity-100"
                            title="Xóa nhãn"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Industry presets list */}
                  <div>
                    <div className="text-[10px] font-bold font-mono text-emerald-500/50 mb-2 uppercase tracking-wide">Nhóm Ngành Phổ Biến:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetIndustries.map(ind => {
                        const isSelected = position.tags?.includes(ind);
                        return (
                          <button
                            key={ind}
                            onClick={() => isSelected ? removeTag(position.id, ind) : addTag(position.id, ind)}
                            className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-all duration-200 ${
                              isSelected 
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_8px_rgba(52,211,153,0.3)]' 
                                : 'bg-black/40 border-emerald-900/30 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                            }`}
                          >
                            {ind}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strategy presets list */}
                  <div>
                    <div className="text-[10px] font-bold font-mono text-emerald-500/50 mb-2 uppercase tracking-wide">Chiến Lược Giao Dịch:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetStrategies.map(strat => {
                        const isSelected = position.tags?.includes(strat);
                        return (
                          <button
                            key={strat}
                            onClick={() => isSelected ? removeTag(position.id, strat) : addTag(position.id, strat)}
                            className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-all duration-200 ${
                              isSelected 
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(34,211,238,0.3)]' 
                                : 'bg-black/40 border-emerald-900/30 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                            }`}
                          >
                            {strat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free-form Tag adding */}
                  <div>
                    <div className="text-[10px] font-bold font-mono text-emerald-500/50 mb-2 uppercase tracking-wide">Tự Định Nghĩa Nhãn Riêng:</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập nhãn tùy ý rồi bấm Thêm (ví dụ: Growth, Hàng T3, Vượt Đỉnh...)"
                        value={customTagInput}
                        onChange={e => setCustomTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        className="flex-1 bg-black/60 border border-zinc-850 focus:border-zinc-600 rounded-lg px-3 py-1.5 text-xs text-[#e0e0e0] focus:outline-none font-sans shadow-inner placeholder-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-555 active:scale-95 text-white rounded-lg text-xs font-semibold font-sans tracking-wide transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0"
                      >
                        THÊM
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Custom Notes */}
              <Card className="p-4 md:p-5 border-zinc-800/80 bg-black/90 group glass-panel relative overflow-hidden flex flex-col min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-990/5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 text-zinc-300 font-sans tracking-wider text-xs relative z-10 font-bold">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>TRANG GHI CHÚ NHẬN ĐỊNH CỦA BẠN</span>
                </div>
                <textarea 
                  value={info.customNotes || ''}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng, nhận định, phân tích cơ bản, hoặc kế hoạch chốt lời / cắt lỗ cho cổ phiếu này..."
                  className="w-full flex-1 bg-black border border-zinc-800 rounded-lg p-5 text-sm text-[#e0e0e0] focus:outline-none focus:border-zinc-600 shadow-inner resize-none transition-all custom-scrollbar relative z-10 font-sans placeholder-zinc-600 leading-relaxed"
                />
              </Card>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
