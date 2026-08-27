import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Cloud, 
  ShieldCheck, 
  Sparkles, 
  Link2, 
  Loader2, 
  LogIn, 
  LogOut, 
  UserCheck, 
  Globe, 
  QrCode, 
  Scissors, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from './ui/core';
import { useStore } from '../store/useStore';
import { savePortfolioToCloud, cleanRoomSlug } from '../lib/portfolioCloudService';
import { auth, googleProvider, firebaseConfig } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { clsx } from 'clsx';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { positions, cashBalance, marketPrices, brandSettings, boardTitle, portfolioStockWeight, themeMode } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [brokerNotes, setBrokerNotes] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  
  // Short URL state
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);

  // Current domain / host
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Initialize slug and listen to auth
  useEffect(() => {
    const defaultSlug = cleanRoomSlug(brandSettings?.appNamePrefix || 'vinh-quang');
    setCustomSlug(defaultSlug);
    setCustomAlias(defaultSlug);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, [brandSettings?.appNamePrefix]);

  const currentSlug = cleanRoomSlug(customSlug || 'vinh-quang');
  const liveShareUrl = `${window.location.origin}${window.location.pathname}?room=${currentSlug}`;

  // Clean alias for custom branded link
  const sanitizeAlias = (alias: string) => {
    return alias
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Function to create short link with custom branded alias via TinyURL or is.gd
  const handleGenerateShortLink = async (targetUrl?: string, preferredAlias?: string) => {
    const url = targetUrl || liveShareUrl;
    const rawAlias = preferredAlias || customAlias || currentSlug;
    const cleanAlias = sanitizeAlias(rawAlias);

    setIsGeneratingShort(true);
    try {
      // First ensure portfolio data is saved to cloud
      await handlePublishToCloud();

      let successShortUrl = '';

      // 1. Try TinyURL with custom alias
      if (cleanAlias) {
        try {
          const tinyAliasRes = await fetch(
            `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${encodeURIComponent(cleanAlias)}`
          );
          if (tinyAliasRes.ok) {
            const resText = await tinyAliasRes.text();
            if (resText && resText.startsWith('http')) {
              successShortUrl = resText;
            }
          }
        } catch (e) {
          console.warn('TinyURL with alias failed, trying fallback options', e);
        }
      }

      // 2. If alias failed or was already taken, try is.gd with custom shorturl
      if (!successShortUrl && cleanAlias) {
        try {
          const isgdRes = await fetch(
            `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}&shorturl=${encodeURIComponent(cleanAlias)}`
          );
          if (isgdRes.ok) {
            const isgdText = await isgdRes.text();
            if (isgdText && isgdText.startsWith('http') && !isgdText.includes('Error:')) {
              successShortUrl = isgdText;
            }
          }
        } catch (e) {
          console.warn('is.gd with alias failed', e);
        }
      }

      // 3. If exact alias was taken, try with unique suffix (e.g. karininvest-2026)
      if (!successShortUrl && cleanAlias) {
        const uniqueBrandAlias = `${cleanAlias}-${Math.floor(100 + Math.random() * 900)}`;
        try {
          const tinyFallbackRes = await fetch(
            `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${encodeURIComponent(uniqueBrandAlias)}`
          );
          if (tinyFallbackRes.ok) {
            const resText = await tinyFallbackRes.text();
            if (resText && resText.startsWith('http')) {
              successShortUrl = resText;
            }
          }
        } catch (e) {
          console.warn('TinyURL fallback alias failed', e);
        }
      }

      // 4. If all custom aliases fail, create standard short url
      if (!successShortUrl) {
        const standardRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        if (standardRes.ok) {
          const standardText = await standardRes.text();
          if (standardText && standardText.startsWith('http')) {
            successShortUrl = standardText;
          }
        }
      }

      if (successShortUrl) {
        setShortUrl(successShortUrl);
      } else {
        setShortUrl(url);
      }
    } catch (e) {
      console.warn('Could not shorten link, using original', e);
      setShortUrl(url);
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const handlePublishToCloud = async (slugToUse?: string) => {
    setIsSavingCloud(true);
    setSavedSuccess(false);
    const targetSlug = cleanRoomSlug(slugToUse || customSlug || 'vinh-quang');
    try {
      const res = await savePortfolioToCloud(targetSlug, {
        title: boardTitle,
        positions,
        cashBalance,
        marketPrices,
        brandSettings,
        portfolioStockWeight,
        themeMode,
        brokerNotes: brokerNotes.trim()
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        return res.id;
      }
    } catch (err) {
      console.error('Save to cloud failed', err);
    } finally {
      setIsSavingCloud(false);
    }
    return targetSlug;
  };

  // Auto publish whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const target = cleanRoomSlug(customSlug || brandSettings?.appNamePrefix || 'vinh-quang');
      handlePublishToCloud(target);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError('unauthorized_domain');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User just closed popup, no need to show scary error
        setAuthError(null);
      } else {
        setAuthError(err.message || 'Không thể đăng nhập Google');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch (e) {
      console.error('Copy hostname failed', e);
    }
  };

  const handleCopyLink = async (textToCopy: string, isShort = false) => {
    try {
      await handlePublishToCloud();
      await navigator.clipboard.writeText(textToCopy);
      if (isShort) {
        setCopiedShort(true);
        setTimeout(() => setCopiedShort(false), 2500);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleOpenPreview = async () => {
    const savedId = await handlePublishToCloud();
    const targetUrl = `${window.location.origin}${window.location.pathname}?room=${savedId || currentSlug}`;
    window.open(targetUrl, '_blank');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortUrl || liveShareUrl)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-[#09090b] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Globe className="w-4 h-4" />
              </span>
              <h2 className="font-bold text-white text-sm sm:text-base font-display uppercase tracking-wide">
                ĐỒNG BỘ CLOUD & TẠO LINK GỬI KHÁCH
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto text-sm custom-scrollbar">
            
            {/* Broker Account Bar */}
            <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {user ? (user.displayName?.[0] || user.email?.[0] || 'M') : <UserCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-200">
                    {user ? user.displayName || user.email : (brandSettings?.appNamePrefix || 'Môi Giới') + ' (Độc Quyền)'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {user ? `Email: ${user.email}` : 'Đồng bộ Cloud đa thiết bị theo Mã Phòng'}
                  </div>
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-zinc-400 hover:text-rose-400 font-mono flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleGoogleLogin}
                  disabled={isAuthLoading}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {isAuthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                  Đăng Nhập Google
                </Button>
              )}
            </div>

            {/* Auth error resolution helper (for Vercel / custom domains) */}
            {authError === 'unauthorized_domain' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 space-y-2 text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Cách kích hoạt Đăng nhập Google trên Vercel:</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Google yêu cầu cấp quyền tên miền Vercel của bạn trước khi cho phép đăng nhập qua Popup:
                </p>
                <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-amber-900/40">
                  <code className="text-emerald-400 font-mono text-[11px] flex-1 truncate">{currentHostname}</code>
                  <Button
                    size="sm"
                    onClick={handleCopyHostname}
                    className="h-6 text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-mono shrink-0"
                  >
                    {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedDomain ? 'Đã chép' : 'Chép tên miền'}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  👉 Vào <strong className="text-zinc-200">Firebase Console</strong> → <strong className="text-zinc-200">Authentication</strong> → <strong className="text-zinc-200">Settings</strong> → <strong className="text-zinc-200">Authorized domains</strong> → Dán tên miền trên vào là xong!
                </p>
                <div className="pt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Lưu ý: Bạn vẫn <strong>LƯU CLOUD</strong> và <strong>GỬI LINK KHÁCH</strong> bình thường 100% mà không bắt buộc phải đăng nhập Google.</span>
                </div>
              </motion.div>
            )}

            {/* Room ID / Slug Config */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Tên Phòng / Định Danh Riêng:</span>
                <span className="text-[10px] text-zinc-400 lowercase">mỗi mã phòng là một danh mục riêng biệt</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2.5 py-2 rounded-lg border border-zinc-800">
                  ?room=
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => {
                    setCustomSlug(e.target.value);
                    setCustomAlias(e.target.value);
                    setShortUrl(''); // Reset short url when room slug changes
                  }}
                  placeholder="vinh-quang hoặc Karininvest"
                  className="flex-1 text-xs rounded-lg bg-black/60 border border-zinc-800 focus:border-emerald-500 focus:outline-none p-2 text-zinc-100 font-mono"
                />
                <Button
                  onClick={() => handlePublishToCloud()}
                  disabled={isSavingCloud}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 shrink-0 flex items-center gap-1"
                >
                  {isSavingCloud ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSuccess ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  {savedSuccess ? 'ĐÃ LƯU CLOUD!' : 'LƯU CLOUD'}
                </Button>
              </div>
            </div>

            {/* Optional Notes from Broker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Lời Nhắn / Khuyến Nghị Cho Khách Hàng:</span>
                <span className="text-[10px] text-zinc-500 lowercase">tự động hiện đầu trang khách mở</span>
              </label>
              <textarea
                value={brokerNotes}
                onChange={(e) => setBrokerNotes(e.target.value)}
                placeholder="Ví dụ: Danh mục khuyến nghị quý 3. Duy trì tỷ trọng 70% CP, giải ngân thêm HPG khi rung lắc..."
                rows={2}
                className="w-full text-xs rounded-lg bg-black/60 border border-zinc-800 focus:border-emerald-500 focus:outline-none p-2.5 text-zinc-200 placeholder-zinc-600 transition-colors"
              />
            </div>

            {/* Short Link Generator Box (Tạo Link Ngắn Thương Hiệu Riêng) */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/30 to-black/60 border border-emerald-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  Link Rút Gọn Thương Hiệu Riêng (Độ Tin Cậy Cao):
                </label>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 font-mono hover:underline cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {showQr ? 'Ẩn QR' : 'Mã QR Quét'}
                </button>
              </div>

              {/* Alias input customizer */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Ký hiệu thương hiệu hiển thị trên link rút gọn:</span>
                  <span className="text-emerald-400 font-mono font-bold">tinyurl.com/{sanitizeAlias(customAlias || currentSlug)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 shrink-0">
                    tinyurl.com/
                  </span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => {
                      setCustomAlias(e.target.value);
                      setShortUrl(''); // Reset short url when alias is edited
                    }}
                    placeholder={currentSlug}
                    className="flex-1 text-xs rounded-lg bg-black/80 border border-zinc-800 focus:border-emerald-500 focus:outline-none px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleGenerateShortLink(liveShareUrl, customAlias)}
                    disabled={isGeneratingShort || isSavingCloud}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 shrink-0 flex items-center gap-1 shadow"
                  >
                    {isGeneratingShort ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    {shortUrl ? 'TẠO LẠI LINK' : 'TẠO LINK THƯƠNG HIỆU'}
                  </Button>
                </div>
              </div>

              {/* Display Result Link */}
              {shortUrl && (
                <div className="pt-2 border-t border-emerald-950/60 flex items-center gap-2">
                  <div className="flex-1 bg-black border border-emerald-500/70 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold overflow-x-auto whitespace-nowrap shadow-inner select-all">
                    {shortUrl}
                  </div>
                  <Button
                    onClick={() => handleCopyLink(shortUrl, true)}
                    className={clsx(
                      "shrink-0 font-bold transition-all px-4 py-2 text-xs flex items-center gap-1.5 shadow-md",
                      copiedShort
                        ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    )}
                  >
                    {copiedShort ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedShort ? 'ĐÃ CHÉP LINK!' : 'CHÉP LINK NGẮN'}
                  </Button>
                </div>
              )}

              {/* QR Code Viewer */}
              {showQr && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-black/90 border border-emerald-500/40 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mt-2"
                >
                  <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                    <img 
                      src={qrImageUrl} 
                      alt="QR Code Danh Mục" 
                      className="w-32 h-32"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <QrCode className="w-4 h-4 text-emerald-400" /> Mã QR Khách Quét Vào Ngay
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Khách hàng chỉ cần mở Zalo hoặc Camera điện thoại quét mã này là lập tức truy cập thẳng vào danh mục trực quan.
                    </p>
                    <a 
                      href={qrImageUrl} 
                      download={`QR_DanhMuc_${currentSlug}.png`} 
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold hover:underline"
                    >
                      Tải ảnh QR về máy ↗
                    </a>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Live URL Box (Original Link) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Đường Link Vercel Trực Tiếp (Direct URL):
              </label>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono overflow-x-auto whitespace-nowrap shadow-inner select-all">
                  {liveShareUrl}
                </div>
                <Button
                  onClick={() => handleCopyLink(liveShareUrl, false)}
                  disabled={isSavingCloud}
                  className={clsx(
                    "shrink-0 font-bold transition-all px-3 py-2 text-xs flex items-center gap-1.5",
                    copied 
                      ? "bg-zinc-700 text-emerald-400" 
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'ĐÃ CHÉP' : 'CHÉP'}
                </Button>
              </div>
            </div>

            {/* Custom Domain Guide Toggle */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDomainGuide(!showDomainGuide)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-zinc-200">Gắn Tên Miền Riêng Miễn Phí Trên Vercel (VD: karininvest.vn)</span>
                </div>
                {showDomainGuide ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showDomainGuide && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-3.5 pb-3.5 text-xs text-zinc-400 space-y-2 border-t border-zinc-800/60 pt-3"
                >
                  <p className="leading-relaxed">
                    Bạn đã đưa web lên Vercel thành công! Để link hiển thị 100% thương hiệu của bạn:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 font-mono text-[11px]">
                    <li>Trong bảng điều khiển <strong>Vercel</strong>, vào dự án của bạn → Chọn tab <strong>Settings</strong> → <strong>Domains</strong>.</li>
                    <li>Điền tên miền riêng của bạn (VD: <code className="text-emerald-400">danhmuc.karininvest.vn</code> hoặc đổi tên subdomain Vercel thành <code className="text-emerald-400">karininvest.vercel.app</code>).</li>
                    <li>Link gửi khách khi đó sẽ là: <code className="text-emerald-400">https://karininvest.vercel.app/?room={currentSlug}</code> — thanh địa chỉ trình duyệt sẽ giữ nguyên vĩnh viễn tên thương hiệu của bạn!</li>
                  </ol>
                </motion.div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/60">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở xem thử giao diện Khách Hàng (Tab Mới)
            </button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs px-4"
            >
              ĐÓNG
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
