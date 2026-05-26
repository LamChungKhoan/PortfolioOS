import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Button } from './ui/core';
import { useDerivedPortfolio } from '../store/useStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { clsx } from 'clsx';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
const CASH_COLOR = '#64748b';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

export function AllocationModal({ isOpen, onClose }: AllocationModalProps) {
  const { positions, cashBalance, totalNav } = useDerivedPortfolio();
  const [viewType, setViewType] = useState<'pie' | 'progress'>('pie');

  // Prepare data
  const data = positions.map((pos, index) => ({
    name: pos.symbol || `Mã ${index + 1}`,
    value: pos.marketValue,
    color: COLORS[index % COLORS.length]
  }));
  
  if (cashBalance > 0) {
    data.push({
      name: 'Tiền mặt',
      value: cashBalance,
      color: CASH_COLOR
    });
  }
  
  // Sort by value descending
  data.sort((a, b) => b.value - a.value);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-html2canvas-ignore="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-gray-950 border border-emerald-900/50 rounded-xl shadow-2xl overflow-hidden glass-panel"
          >
            <div className="p-6 border-b border-emerald-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-display text-white" style={{ textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                    PHÂN BỔ TÀI SẢN
                  </h3>
                  <p className="text-emerald-500/70 text-sm font-mono mt-1">Cơ cấu danh mục đầu tư</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-gray-900 rounded-lg p-1 border border-emerald-900/30">
                    <button
                      onClick={() => setViewType('pie')}
                      className={clsx("p-2 rounded flex items-center justify-center transition-colors", viewType === 'pie' ? "bg-emerald-900/50 text-emerald-400" : "text-gray-500 hover:text-emerald-300")}
                      title="Biểu đồ tròn"
                    >
                      <PieChartIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewType('progress')}
                      className={clsx("p-2 rounded flex items-center justify-center transition-colors", viewType === 'progress' ? "bg-emerald-900/50 text-emerald-400" : "text-gray-500 hover:text-emerald-300")}
                      title="Biểu đồ thanh"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {totalNav === 0 ? (
                <div className="flex items-center justify-center h-64 text-emerald-500/50 font-mono text-sm">
                  KHÔNG CÓ TÀI SẢN ĐỂ HIỂN THỊ
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="bg-gray-900 border border-emerald-900/30 rounded-lg p-4 w-full md:w-auto min-w-[200px]">
                      <div className="text-xs font-mono text-emerald-50 mb-1">TỔNG TÀI SẢN (NAV)</div>
                      <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalNav)} ₫</div>
                    </div>
                  </div>

                  {viewType === 'pie' ? (
                    <div className="h-80 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                              const RADIAN = Math.PI / 180;
                              // Position label slightly outside the center of the slice
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              const item = data[index];
                              const pct = value / totalNav;
                              
                              if (pct < 0.05) return null; // Hide label for small slices
                              
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="white" 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  className="font-mono text-[11px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                >
                                  {item.name}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => [`${formatCurrency(value)} ₫`, 'Giá trị']}
                            contentStyle={{ backgroundColor: '#030712', borderColor: '#065f46', fontFamily: 'monospace', fontSize: '13px', borderRadius: '8px' }}
                            itemStyle={{ color: '#ecfdf5' }}
                          />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            wrapperStyle={{ fontFamily: 'monospace', fontSize: '14px' }}
                            content={({ payload }) => (
                              <ul className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-900/50">
                                {payload?.map((entry, index) => {
                                  const item = data.find(d => d.name === entry.value);
                                  const pct = item ? (item.value / totalNav * 100).toFixed(1) : '0';
                                  return (
                                    <li key={`item-${index}`} className="flex items-center gap-3 bg-gray-900/80 border border-emerald-900/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                                      <div className="w-4 h-4 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                                      <span className="text-white font-bold min-w-[70px] drop-shadow-sm">{entry.value}</span>
                                      <span className="text-emerald-400 font-semibold ml-auto">{pct}%</span>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="flex h-12 w-full rounded-lg overflow-hidden bg-gray-900 border border-emerald-900/30">
                        {data.map((item, index) => {
                          const width = `${(item.value / totalNav) * 100}%`;
                          return (
                            <div 
                              key={index} 
                              style={{ width, backgroundColor: item.color }}
                              className="h-full flex items-center justify-center transition-all group relative border-r border-gray-950 last:border-0"
                            >
                              {(item.value / totalNav) > 0.05 && (
                                <span className="text-[10px] sm:text-xs font-mono font-bold text-white drop-shadow-md truncate px-1">
                                  {item.name}
                                </span>
                              )}
                              
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-12 bg-gray-900 border border-emerald-500/30 text-white text-xs font-mono py-1.5 px-3 rounded whitespace-nowrap z-10 -ml-10 pointer-events-none">
                                {item.name}: {formatCurrency(item.value)} ₫ ({(item.value / totalNav * 100).toFixed(1)}%)
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {data.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color }} />
                            <div>
                              <div className="text-xs font-mono text-emerald-50 font-bold mb-0.5">{item.name}</div>
                              <div className="text-[10px] font-mono text-emerald-500/70">{(item.value / totalNav * 100).toFixed(1)}% / {formatCurrency(item.value)} ₫</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
