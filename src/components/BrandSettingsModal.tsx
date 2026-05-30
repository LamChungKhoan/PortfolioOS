import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, Palette, Settings, Sparkles, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from './ui/core';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const themePresets = [
  { name: 'emerald', label: 'Xanh Lá Emerald', hue: 161, sat: '84%', hex: '#10B981' },
  { name: 'cyan', label: 'Xanh Cyan Điện Tử', hue: 190, sat: '90%', hex: '#06B6D4' },
  { name: 'blue', label: 'Xanh Dương Lam', hue: 217, sat: '91%', hex: '#3B82F6' },
  { name: 'violet', label: 'Tím Cyber Punk', hue: 262, sat: '83%', hex: '#8B5CF6' },
  { name: 'amber', label: 'Vàng Hoàng Cực', hue: 38, sat: '92%', hex: '#F59E0B' },
  { name: 'rose', label: 'Đỏ Hồng Neon', hue: 350, sat: '89%', hex: '#F43F5E' },
  { name: 'slate', label: 'Xám Titanium', hue: 215, sat: '14%', hex: '#64748B' },
];

const availableIcons = [
  { id: 'LayoutDashboard', label: 'Bảng số liệu', icon: Icons.LayoutDashboard },
  { id: 'TrendingUp', label: 'Xu hướng', icon: Icons.TrendingUp },
  { id: 'Activity', label: 'Biểu đồ sống', icon: Icons.Activity },
  { id: 'Coins', label: 'Đế chế tiền', icon: Icons.Coins },
  { id: 'Zap', label: 'Phóng tia lửa', icon: Icons.Zap },
  { id: 'Shield', label: 'An toàn nhất', icon: Icons.Shield },
  { id: 'Briefcase', label: 'Chiến hạm đầu tư', icon: Icons.Briefcase },
  { id: 'Wallet', label: 'Két sắt', icon: Icons.Wallet },
  { id: 'Compass', label: 'Hải trình', icon: Icons.Compass },
  { id: 'PieChart', label: 'Phần trăm bánh', icon: Icons.PieChart },
];

export function BrandSettingsModal({ isOpen, onClose }: BrandSettingsModalProps) {
  const brandSettings = useStore(state => state.brandSettings);
  const updateBrandSettings = useStore(state => state.updateBrandSettings);

  const [prefix, setPrefix] = useState(brandSettings?.appNamePrefix || 'Portfolio');
  const [suffix, setSuffix] = useState(brandSettings?.appNameSuffix || 'OS');
  const [activeIcon, setActiveIcon] = useState(brandSettings?.logoIcon || 'LayoutDashboard');
  const [hue, setHue] = useState(brandSettings?.themeHue ?? 161);
  const [sat, setSat] = useState(brandSettings?.themeSaturation || '84%');
  const [presetName, setPresetName] = useState(brandSettings?.themeName || 'emerald');

  const handleApplyPreset = (p: typeof themePresets[0]) => {
    setHue(p.hue);
    setSat(p.sat);
    setPresetName(p.name);
  };

  const handleApplySettings = () => {
    updateBrandSettings({
      appNamePrefix: prefix.trim() || 'Portfolio',
      appNameSuffix: suffix.trim() || 'OS',
      logoIcon: activeIcon,
      themeHue: hue,
      themeSaturation: sat,
      themeName: presetName,
    });
    onClose();
  };

  const handleResetDefault = () => {
    setPrefix('Portfolio');
    setSuffix('OS');
    setActiveIcon('LayoutDashboard');
    setHue(161);
    setSat('84%');
    setPresetName('emerald');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <React.Fragment>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, rotateY: 10, y: 15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, rotateY: -10, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="fixed inset-x-4 top-[8%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] h-fit max-h-[85vh] glass-panel border border-emerald-500/35 rounded-xl shadow-[0_0_60px_rgba(16,185,129,0.2)] z-50 flex flex-col overflow-hidden"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/40 bg-black/40 relative z-10">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold font-display text-white tracking-wider flex items-center gap-1.5">
                THIẾT KẾ & THƯƠNG HIỆU <sub className="text-[9px] text-emerald-500 font-mono tracking-normal">CÁ NHÂN HÓA</sub>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c0c0e]/90 relative z-10 font-mono text-xs max-h-[70vh] custom-scrollbar">
            
            {/* Visual preview */}
            <div className="p-4 rounded-lg bg-[#040806] border border-emerald-500/20 relative overflow-hidden flex items-center justify-between">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
              <div>
                <span className="text-[10px] text-emerald-500/50 block mb-1">Giao Diện Demo Góc Trái:</span>
                <div className="flex items-center">
                  <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center mr-3 shadow-[0_0_15px_var(--theme-emerald-500)]">
                    {React.createElement((Icons as any)[activeIcon] || Icons.LayoutDashboard, { className: "w-4 h-4 text-black font-bold" })}
                  </div>
                  <span className="font-bold tracking-tight text-white text-lg font-sans">
                    {prefix}<span className="text-emerald-500 font-semibold">{suffix}</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-500/50 block mb-1">Theme name:</span>
                <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {presetName === 'custom' ? `Custom (Hue: ${hue}°)` : presetName}
                </span>
              </div>
            </div>

            {/* Prefix & Suffix Config */}
            <Card className="p-4 border-zinc-800/80 bg-black/40 space-y-4">
              <span className="text-zinc-300 font-bold block mb-1 tracking-wider uppercase">1. Tiêu Đề Ứng Dụng</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Phần Chữ Chính (Prefix):</label>
                  <input
                    type="text"
                    value={prefix}
                    maxLength={15}
                    onChange={e => setPrefix(e.target.value)}
                    placeholder="ví dụ: Portfolio"
                    className="w-full bg-black border border-zinc-800 focus:border-zinc-650 rounded p-2 text-xs focus:outline-none text-[#e0e0e0] font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Phần Chữ Nhấn Mạnh (Suffix):</label>
                  <input
                    type="text"
                    value={suffix}
                    maxLength={10}
                    onChange={e => setSuffix(e.target.value)}
                    placeholder="ví dụ: OS"
                    className="w-full bg-black border border-zinc-800 focus:border-zinc-650 rounded p-2 text-xs focus:outline-none text-zinc-300 font-sans font-semibold"
                  />
                </div>
              </div>
            </Card>

            {/* Icon Selec */}
            <Card className="p-4 border-emerald-900/30 bg-black/40 space-y-3">
              <span className="text-emerald-400 font-bold block tracking-wider uppercase">2. Chọn Biểu Tượng Thương Hiệu</span>
              <div className="grid grid-cols-5 gap-2">
                {availableIcons.map(item => {
                  const SelectedIconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveIcon(item.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                        activeIcon === item.id 
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
                          : 'bg-black/40 border-emerald-990/20 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300'
                      }`}
                      title={item.label}
                    >
                      <SelectedIconComponent className="w-5 h-5 mb-1" />
                      <span className="text-[8px] tracking-tight truncate max-w-full font-sans uppercase">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Presets Grid */}
            <Card className="p-4 border-emerald-900/30 bg-black/40 space-y-3">
              <span className="text-emerald-400 font-bold block tracking-wider uppercase">3. Chọn Màu Sắc Chủ Đạo (Theme Presets)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {themePresets.map(p => {
                  const isSelected = presetName === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => handleApplyPreset(p)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-350 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
                          : 'bg-black/30 border-emerald-990/20 hover:border-emerald-500/30 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/50 shrink-0" style={{ backgroundColor: p.hex }} />
                      <span className="text-[10px] truncate uppercase font-sans tracking-tight">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Advanced Custom Hue Slider */}
              <div className="pt-3 border-t border-emerald-900/20 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-emerald-500/60 block uppercase">Chỉnh Màu Sắc Tự Do (HUE)</label>
                  <span className="text-[11px] font-bold text-emerald-400 font-sans">{hue}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hue}
                    onChange={e => {
                      setHue(Number(e.target.value));
                      setPresetName('custom');
                    }}
                    className="flex-1 accent-emerald-500 h-1 bg-emerald-950/50 rounded-lg cursor-pointer appearance-none"
                    style={{
                      background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ef4444)'
                    }}
                  />
                  <div className="w-5 h-5 rounded border border-white/20 shadow-sm shrink-0" style={{ backgroundColor: `hsl(${hue} ${sat} 44%)` }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-emerald-500/60 block uppercase">Điều chỉnh độ bão hòa (SATURATION)</label>
                    <select
                      value={sat}
                      onChange={e => {
                        setSat(e.target.value);
                        setPresetName('custom');
                      }}
                      className="bg-black text-[11px] border border-emerald-900/40 rounded p-1 text-emerald-300 w-full focus:outline-none"
                    >
                      <option value="95%">Rực Rỡ Nhất (95%)</option>
                      <option value="84%">Tiêu Chuẩn (84%)</option>
                      <option value="60%">Nhã Nhặn (60%)</option>
                      <option value="35%">Tối Giản Slate (35%)</option>
                      <option value="15%">Xám Titan Monochromatic (15%)</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleResetDefault}
                      className="text-center hover:bg-emerald-950/25 border border-emerald-900/20 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 py-1.5 rounded text-[10px] transition-all"
                    >
                      MẶC ĐỊNH LỤC BẢO
                    </button>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Actions */}
          <div className="p-4 border-t border-emerald-900/40 bg-black/40 flex items-center justify-end gap-3 z-10">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-emerald-900/40 hover:border-emerald-500/35 hover:bg-emerald-950/15 text-emerald-500 hover:text-emerald-350 rounded-lg text-xs font-bold transition-all"
            >
              HỦY BỎ
            </button>
            <button
              onClick={handleApplySettings}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-550 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <Check className="w-4 h-4 text-white" />
              ÁP DỤNG THƯƠNG HIỆU
            </button>
          </div>
        </motion.div>
      </React.Fragment>
    </AnimatePresence>
  );
}
