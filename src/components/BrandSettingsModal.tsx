import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, Palette, Sparkles, Check, Upload, Trash2, Image as ImageIcon, Wand2, Shield, Eye } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from './ui/core';
import { BrandLogoDisplay } from './BrandLogoDisplay';

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
  const themeMode = useStore(state => state.themeMode || 'cyber');
  const updateBrandSettings = useStore(state => state.updateBrandSettings);

  const [prefix, setPrefix] = useState(brandSettings?.appNamePrefix || 'Portfolio');
  const [suffix, setSuffix] = useState(brandSettings?.appNameSuffix || 'OS');
  const [activeIcon, setActiveIcon] = useState(brandSettings?.logoIcon || 'LayoutDashboard');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(brandSettings?.customLogoUrl);
  const [logoStyleMode, setLogoStyleMode] = useState<'clean' | 'glass' | 'light' | string>(
    brandSettings?.logoStyleMode || 'clean'
  );
  const [hue, setHue] = useState(brandSettings?.themeHue ?? 161);
  const [sat, setSat] = useState(brandSettings?.themeSaturation || '84%');
  const [presetName, setPresetName] = useState(brandSettings?.themeName || 'emerald');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyPreset = (p: typeof themePresets[0]) => {
    setHue(p.hue);
    setSat(p.sat);
    setPresetName(p.name);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale to max 256x256 to keep storage tiny and performance fast
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          setCustomLogoUrl(dataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplySettings = () => {
    updateBrandSettings({
      appNamePrefix: prefix.trim() || 'Portfolio',
      appNameSuffix: suffix.trim() || 'OS',
      logoIcon: activeIcon,
      customLogoUrl: customLogoUrl,
      logoStyleMode: logoStyleMode,
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
    setCustomLogoUrl(undefined);
    setLogoStyleMode('auto-theme');
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="fixed inset-x-4 top-[6%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[660px] h-fit max-h-[88vh] bg-[#0d0f12] border border-emerald-500/35 rounded-xl shadow-[0_0_60px_rgba(16,185,129,0.2)] z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/40 bg-black/60 relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-wider flex items-center gap-2">
                THƯƠNG HIỆU & LOGO <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">MÔI GIỚI VIP</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0a0c0e] relative z-10 font-mono text-xs max-h-[72vh] custom-scrollbar">
            
            {/* Visual preview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#050a08] to-[#0d1310] border border-emerald-500/30 relative overflow-hidden flex items-center justify-between shadow-inner">
              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
              <div>
                <span className="text-[10px] text-emerald-400/70 block mb-1 uppercase font-bold tracking-wider">Xem Trước Nhận Diện Góc Trái & Báo Cáo:</span>
                <div className="flex items-center gap-3">
                  <BrandLogoDisplay
                    customLogoUrl={customLogoUrl}
                    logoIcon={activeIcon}
                    logoStyleMode={logoStyleMode}
                    themeMode={themeMode}
                    size="md"
                  />
                  <div>
                    <div className="font-bold tracking-tight text-white text-lg font-sans flex items-center">
                      {prefix}<span className="text-emerald-400 font-semibold">{suffix}</span>
                    </div>
                    <div className="text-[10px] text-emerald-500/60 font-sans">
                      {customLogoUrl ? 'Logo Tải Lên Độc Quyền' : 'Biểu Tượng Vector Mặc Định'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-500/60 block mb-1 font-sans">Kiểu hiển thị:</span>
                <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider font-sans">
                  {logoStyleMode === 'light' ? 'Nền Sáng Tương Phản' : 
                   logoStyleMode === 'glass' ? 'Kính Tối Sang Trọng' : 'Tự Nhiên Sắc Nét'}
                </span>
              </div>
            </div>

            {/* Upload Custom Logo Section */}
            <Card className="p-4 border-emerald-900/40 bg-black/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold block tracking-wider uppercase flex items-center gap-1.5 text-xs font-sans">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  1. Tải Lên Logo Thương Hiệu Riêng (Tùy Chọn)
                </span>
                {customLogoUrl && (
                  <button
                    onClick={() => setCustomLogoUrl(undefined)}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer font-sans"
                  >
                    <Trash2 className="w-3 h-3" />
                    Dùng icon vector mặc định
                  </button>
                )}
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-emerald-400 bg-emerald-950/30 scale-[1.01]' 
                    : 'border-zinc-800 hover:border-emerald-500/50 bg-black/40 hover:bg-emerald-950/15'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {customLogoUrl ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-12 h-12 rounded-lg bg-black/40 border border-emerald-500/30 p-1 flex items-center justify-center">
                      <img src={customLogoUrl} alt="Uploaded logo preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left font-sans">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã tải logo thành công
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Nhấp vào đây để chọn ảnh khác (PNG, SVG, JPG, WebP)</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="font-sans">
                      <span className="text-xs font-bold text-zinc-200 block">Kéo thả hoặc Nhấp để chọn Logo thương hiệu</span>
                      <span className="text-[10px] text-zinc-400">Hỗ trợ PNG trong suốt, SVG, JPG, WebP (Tối đa 5MB)</span>
                    </div>
                  </>
                )}
              </div>

              {/* Graphic Processing Modes for custom logo */}
              {customLogoUrl && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <label className="text-[11px] text-zinc-300 font-bold block uppercase flex items-center gap-1 font-sans">
                    <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                    Kiểu Hiển Thị Logo:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoStyleMode('clean')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        logoStyleMode === 'clean' || !logoStyleMode
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-sans flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Tự Nhiên & Sắc Nét
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-1 leading-relaxed">
                        Hiển thị chuẩn xác 100% màu sắc và đường nét gốc của logo, không viền thừa.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogoStyleMode('glass')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        logoStyleMode === 'glass' || logoStyleMode === 'neon-glow'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-sans flex items-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" /> Kính Tối Sang Trọng
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-1 leading-relaxed">
                        Đặt trong khối kính đen viền ánh sáng vi quang sang trọng, liền mạch với theme.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogoStyleMode('light')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        logoStyleMode === 'light' || logoStyleMode === 'white-badge' || logoStyleMode === 'framed'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-sans flex items-center gap-1">
                        <Eye className="w-3 h-3 text-amber-400" /> Nền Sáng Tương Phản
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-1 leading-relaxed">
                        Thẻ nền sáng phẳng, phù hợp cho logo có màu sắc quá tối hoặc chữ màu sẫm.
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Prefix & Suffix Config */}
            <Card className="p-4 border-zinc-800/80 bg-black/40 space-y-4">
              <span className="text-zinc-300 font-bold block tracking-wider uppercase">2. Tên Thương Hiệu / Phòng Giao Dịch</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-sans">Tên Chính (Prefix):</label>
                  <input
                    type="text"
                    value={prefix}
                    maxLength={20}
                    onChange={e => setPrefix(e.target.value)}
                    placeholder="ví dụ: Portfolio hoặc Vinh Quang"
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-[#e0e0e0] font-sans font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-sans">Hậu Tố Nhấn Mạnh (Suffix):</label>
                  <input
                    type="text"
                    value={suffix}
                    maxLength={15}
                    onChange={e => setSuffix(e.target.value)}
                    placeholder="ví dụ: OS hoặc Capital"
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-emerald-400 font-sans font-bold"
                  />
                </div>
              </div>
            </Card>

            {/* Icon Select (Fallback if no custom logo) */}
            {!customLogoUrl && (
              <Card className="p-4 border-emerald-900/30 bg-black/40 space-y-3">
                <span className="text-emerald-400 font-bold block tracking-wider uppercase">3. Hoặc Chọn Biểu Tượng Sẵn Có</span>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map(item => {
                    const SelectedIconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIcon(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          activeIcon === item.id 
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
                            : 'bg-black/40 border-emerald-900/20 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300'
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
            )}

            {/* Presets Grid */}
            <Card className="p-4 border-emerald-900/30 bg-black/40 space-y-3">
              <span className="text-emerald-400 font-bold block tracking-wider uppercase">
                {customLogoUrl ? '3.' : '4.'} Tông Màu Nhận Diện (Theme Color)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {themePresets.map(p => {
                  const isSelected = presetName === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
                          : 'bg-black/30 border-emerald-900/20 hover:border-emerald-500/30 text-slate-400 hover:text-white'
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
                  <label className="text-[10px] text-emerald-500/60 block uppercase font-sans">Chỉnh Màu Sắc Tự Do (HUE)</label>
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
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="hover:bg-emerald-950/25 border border-emerald-900/20 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 px-3 py-1 rounded text-[10px] transition-all cursor-pointer font-sans"
                  >
                    KHÔI PHỤC MẶC ĐỊNH
                  </button>
                </div>
              </div>
            </Card>

          </div>

          {/* Actions */}
          <div className="p-4 border-t border-emerald-900/40 bg-black/60 flex items-center justify-end gap-3 z-10 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-emerald-900/40 hover:border-emerald-500/35 hover:bg-emerald-950/15 text-emerald-500 hover:text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button
              onClick={handleApplySettings}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer font-sans"
            >
              <Check className="w-4 h-4 text-white" />
              LƯU THƯƠNG HIỆU
            </button>
          </div>
        </motion.div>
      </React.Fragment>
    </AnimatePresence>
  );
}

