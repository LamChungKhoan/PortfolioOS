import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieChartIcon, BarChart3, Scale, Info, Sparkles } from 'lucide-react';
import { Button } from './ui/core';
import { useDerivedPortfolio, useStore } from '../store/useStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { clsx } from 'clsx';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllocationModal({ isOpen, onClose }: AllocationModalProps) {
  const { positions } = useDerivedPortfolio();
  const updateAllocationWeight = useStore(state => state.updateAllocationWeight);
  const [viewType, setViewType] = useState<'pie' | 'progress'>('pie');

  // Compute total of custom entered weights
  const totalCustomWeight = positions.reduce((sum, p) => sum + (p.allocationWeight !== undefined ? p.allocationWeight : 0), 0);

  // Prepare data for Recharts based on weight percent
  const chartData = positions.map((pos, index) => ({
    name: pos.symbol || `CP ${index + 1}`,
    value: pos.weightPercent > 0 ? parseFloat(pos.weightPercent.toFixed(1)) : 0,
    userWeight: pos.allocationWeight !== undefined ? pos.allocationWeight : 0,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  // Sort by final percentage descending
  chartData.sort((a, b) => b.value - a.value);

  // Equalize weights to be uniform
  const handleEqualize = () => {
    if (positions.length === 0) return;
    const equalWeight = Math.round(100 / positions.length);
    positions.forEach(pos => {
      updateAllocationWeight(pos.id, equalWeight);
    });
  };

  // Convert current custom weights to sum exactly to 100
  const handleScaleTo100 = () => {
    if (positions.length === 0) return;
    const totalCurrent = positions.reduce((sum, p) => sum + (p.allocationWeight !== undefined ? p.allocationWeight : 0), 0);
    if (totalCurrent === 0) {
      handleEqualize();
      return;
    }
    
    positions.forEach(pos => {
      const current = pos.allocationWeight !== undefined ? pos.allocationWeight : 0;
      const scaled = Math.round((current / totalCurrent) * 100);
      updateAllocationWeight(pos.id, scaled);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-html2canvas-ignore="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-gray-950 border border-emerald-900/50 rounded-xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-emerald-950/60 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2" style={{ textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                    <PieChartIcon className="w-5 h-5 text-emerald-400" />
                    CƠ CẤU DANH MỤC CỔ PHIẾU
                  </h3>
                  <p className="text-emerald-500/70 text-xs font-mono mt-1 uppercase tracking-wider">
                    Tùy chỉnh tỷ trọng phân bổ tài sản như mong muốn
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-900 rounded-lg p-1 border border-emerald-900/30">
                    <button
                      onClick={() => setViewType('pie')}
                      className={clsx(
                        "p-1.5 rounded flex items-center justify-center transition-colors",
                        viewType === 'pie' ? "bg-emerald-900/50 text-emerald-400 font-bold" : "text-gray-500 hover:text-emerald-300"
                      )}
                      title="Biểu đồ tròn"
                    >
                      <PieChartIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewType('progress')}
                      className={clsx(
                        "p-1.5 rounded flex items-center justify-center transition-colors",
                        viewType === 'progress' ? "bg-emerald-900/50 text-emerald-400 font-bold" : "text-gray-500 hover:text-emerald-300"
                      )}
                      title="Biểu đồ thanh"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Container (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <PieChartIcon className="w-12 h-12 text-emerald-900/30 mb-3 animate-pulse" />
                  <div className="text-emerald-500/40 font-mono text-sm uppercase tracking-widest">
                    Không có cổ phiếu nào trong danh mục
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">Huy thêm mã cổ phiếu từ bảng danh mục trước</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Visualizer Chart */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/30 border border-emerald-950/40 p-5 rounded-xl h-full min-h-[340px]">
                    
                    {chartData.length === 0 ? (
                      <div className="flex flex-col items-center text-center py-12">
                        <Info className="w-8 h-8 text-amber-500/40 mb-2" />
                        <div className="text-sm font-mono text-amber-500/50 uppercase tracking-wider font-semibold">Tất cả tỷ trọng hiện bằng 0</div>
                        <p className="text-xs text-zinc-500 max-w-xs mt-1">Hệ thống sẽ tạm phân bổ đều cho đến khi bạn điền tỷ trọng hoặc nhấn "Tự động cân bằng đều"</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-2">
                          <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest">Biểu đồ cơ cấu cuối cùng</span>
                          <div className="text-xs font-mono font-bold text-emerald-400/90 mt-0.5">TỰ ĐỘNG CHUYỂN ĐỔI THEO TỶ TRỌNG TƯƠNG ĐỐI</div>
                        </div>

                        {viewType === 'pie' ? (
                          <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={100}
                                  paddingAngle={3}
                                  dataKey="value"
                                  stroke="none"
                                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    
                                    if (value < 6) return null; // hide minimal slivers
                                    return (
                                      <text 
                                        x={x} 
                                        y={y} 
                                        fill="white" 
                                        textAnchor="middle" 
                                        dominantBaseline="central" 
                                        className="font-mono text-xs font-black drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]"
                                      >
                                        {name}
                                      </text>
                                    );
                                  }}
                                  labelLine={false}
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: number) => [`${value}%`, 'Tỷ trọng thực']}
                                  contentStyle={{ backgroundColor: '#030712', borderColor: '#065f46', fontFamily: 'monospace', fontSize: '13px', borderRadius: '8px' }}
                                  itemStyle={{ color: '#ecfdf5' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col gap-4 py-8">
                            <div className="flex h-10 w-full rounded-lg overflow-hidden bg-black/50 border border-emerald-950/60 shadow-inner">
                              {chartData.map((item, index) => {
                                const width = `${item.value}%`;
                                return (
                                  <div 
                                    key={index} 
                                    style={{ width, backgroundColor: item.color }}
                                    className="h-full flex items-center justify-center transition-all relative border-r border-gray-950 last:border-0"
                                  >
                                    {item.value > 8 && (
                                      <span className="text-[10px] font-mono font-black text-white drop-shadow-md truncate px-1">
                                        {item.name}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            
                            <div className="space-y-2 mt-4 w-full">
                              {chartData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded border border-emerald-950/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[13px] font-mono font-extrabold text-emerald-50">{item.name}</span>
                                  </div>
                                  <span className="text-sm font-mono font-bold text-emerald-400">{item.value.toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-2 text-center text-[11px] text-zinc-500 font-mono tracking-wide leading-relaxed">
                          Tỷ lệ phần trăm đại diện cho tỷ trọng tương đối giữa các cổ phiếu do bạn tùy chọn nhập vào.
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Custom Weight Manager */}
                  <div className="lg:col-span-6 flex flex-col gap-5">
                    
                    {/* Controls Toolbar */}
                    <div className="flex flex-wrap gap-2 justify-between items-center bg-zinc-900/50 p-4 border border-emerald-950/40 rounded-xl">
                      <div>
                        <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Cách thức hoạt động:</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Tự do nhập điểm/số bất kỳ. Hệ thống tự đồng cân bằng thành 100%.</div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleEqualize}
                          className="h-8 text-[11px] font-mono font-bold bg-emerald-950/20 hover:bg-emerald-900/40 border-emerald-900/40 text-emerald-400"
                        >
                           chia đều
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleScaleTo100}
                          className="h-8 text-[11px] font-mono font-bold bg-blue-950/20 hover:bg-blue-900/40 border-blue-900/40 text-blue-400 flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3" /> quy tròn 100%
                        </Button>
                      </div>
                    </div>

                    {/* Weight Inputs List */}
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 select-none custom-scrollbar pb-3">
                      {positions.map((pos, index) => {
                        const color = COLORS[index % COLORS.length];
                        const usersVal = pos.allocationWeight !== undefined ? pos.allocationWeight : 0;
                        const finalPct = pos.weightPercent;
                        
                        return (
                          <div 
                            key={pos.id} 
                            className="flex items-center justify-between gap-4 bg-zinc-900/70 border border-emerald-950/30 px-4 py-3.5 rounded-lg hover:border-emerald-500/20 focus-within:border-emerald-500/40 transition-all shadow-inner"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
                              <div>
                                <div className="text-base font-extrabold font-mono text-white tracking-wider uppercase">
                                  {pos.symbol || 'MÃ CP'}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">
                                  Tỷ lệ thực: <span className="text-emerald-400 font-bold">{finalPct.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                placeholder="0"
                                className="w-20 bg-black/90 border border-zinc-800 rounded px-2.5 py-1.5 text-center font-mono text-emerald-400 text-lg font-bold focus:outline-none focus:border-emerald-500/80 transition-all shadow-inner"
                                value={pos.allocationWeight !== undefined ? pos.allocationWeight : ''}
                                onChange={(e) => {
                                  const textVal = e.target.value;
                                  const val = textVal === '' ? 0 : Number(textVal);
                                  updateAllocationWeight(pos.id, Math.max(0, val));
                                }}
                              />
                              <span className="text-xs font-mono text-zinc-500 font-semibold">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex items-center justify-between text-xs font-mono py-3.5 px-4 rounded-lg bg-black/40 border border-emerald-950/40">
                      <span className="text-zinc-400 uppercase font-semibold">Tổng điểm tỷ trọng tự chọn:</span>
                      
                      {totalCustomWeight === 100 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black tracking-wider">
                          ● ĐẠT TRÒN 100%
                        </span>
                      ) : totalCustomWeight === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold">
                          ● ĐANG CHIA ĐỀU TỰ ĐỘNG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-bold">
                          ● TỔNG: {totalCustomWeight}% (ĐÃ TỰ ĐỘNG QUY ĐỒI)
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-emerald-950/60 bg-black/30 shrink-0 text-right">
              <Button onClick={onClose} variant="outline" className="px-5 border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/30 font-mono text-xs uppercase tracking-wider font-bold">
                Hoàn thành & Đóng
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
