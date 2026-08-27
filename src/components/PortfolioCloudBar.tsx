import React, { useState } from 'react';
import { 
  Cloud, 
  Check, 
  Loader2, 
  LogIn, 
  LogOut, 
  FolderPlus, 
  ChevronDown, 
  Folder, 
  Share2, 
  User, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { fetchPortfolioFromCloud, cleanRoomSlug } from '../lib/portfolioCloudService';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface PortfolioCloudBarProps {
  onOpenShareModal: () => void;
}

export function PortfolioCloudBar({ onOpenShareModal }: PortfolioCloudBarProps) {
  const {
    currentUser,
    cloudSyncStatus,
    activeRoomId,
    setActiveRoomId,
    userSavedRooms,
    boardTitle,
    loadCloudState,
    createNewPortfolio,
    themeMode,
  } = useStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const isLight = themeMode === 'light';

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSwitchPortfolio = async (roomId: string) => {
    setIsLoadingRoom(true);
    setIsDropdownOpen(false);
    try {
      const data = await fetchPortfolioFromCloud(roomId);
      if (data) {
        loadCloudState(data);
        setActiveRoomId(roomId);
      }
    } catch (e) {
      console.error('Failed to load portfolio:', e);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleCreateNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const cleanId = cleanRoomSlug(newSlug || newTitle);
    createNewPortfolio(newTitle.trim(), cleanId);
    setIsCreatingNew(false);
    setNewTitle('');
    setNewSlug('');
    setIsDropdownOpen(false);
  };

  return (
    <div className={clsx(
      "flex items-center gap-2 text-xs",
      isLight ? "text-slate-700" : "text-zinc-300"
    )}>
      {/* Cloud Sync Status Indicator */}
      <div className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-lg bg-black/40 border border-zinc-800/80">
        {cloudSyncStatus === 'saving' || isLoadingRoom ? (
          <span className="flex items-center gap-1 text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden md:inline">Đang đồng bộ Cloud...</span>
          </span>
        ) : cloudSyncStatus === 'synced' && currentUser ? (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden md:inline">Cloud: {currentUser.email.split('@')[0]}</span>
          </span>
        ) : cloudSyncStatus === 'error' ? (
          <span className="flex items-center gap-1 text-rose-400">
            <AlertCircle className="w-3 h-3" />
            <span className="hidden md:inline">Lỗi kết nối Cloud</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400">
            <Cloud className="w-3 h-3" />
            <span className="hidden md:inline">Offline (Lưu cục bộ)</span>
          </span>
        )}
      </div>

      {/* Portfolio Selector & Manager Dropdown */}
      {currentUser ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border",
              isLight 
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" 
                : "bg-zinc-900/90 hover:bg-zinc-800 border-emerald-500/40 text-emerald-300 shadow-sm"
            )}
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate font-display">
              {boardTitle || `Phòng: ${activeRoomId}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-full mt-1.5 w-72 bg-[#09090b] border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-2 overflow-hidden"
              >
                <div className="px-2 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>DANH MỤC CỦA BẠN</span>
                  <span className="text-emerald-400 font-bold">{userSavedRooms.length || 1} phòng</span>
                </div>

                {/* List of saved portfolios */}
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                  {userSavedRooms.length > 0 ? (
                    userSavedRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleSwitchPortfolio(room.id)}
                        className={clsx(
                          "w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors",
                          activeRoomId === room.id 
                            ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold" 
                            : "hover:bg-zinc-800/80 text-zinc-300"
                        )}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate text-xs">{room.title || room.id}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">?room={room.id}</div>
                        </div>
                        {activeRoomId === room.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-center text-zinc-500 text-xs">
                      Đang ở phòng: <strong className="text-emerald-400">{activeRoomId}</strong>
                    </div>
                  )}
                </div>

                {/* Create New Portfolio Form / Button */}
                {isCreatingNew ? (
                  <form onSubmit={handleCreateNewSubmit} className="p-2 bg-black/60 rounded-lg border border-emerald-500/30 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-400">Tạo Danh Mục Mới:</div>
                    <input
                      type="text"
                      placeholder="VD: DANH MỤC APPLECAPITAL"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-400"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Mã phòng URL (VD: applecap)"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300 font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 rounded text-xs"
                      >
                        Tạo & Đồng bộ
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs hover:text-white"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Tạo Danh Mục Mới</span>
                  </button>
                )}

                {/* Broker Account & Logout */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                  <div className="truncate text-zinc-400 max-w-[170px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono"
                  >
                    <LogOut className="w-3 h-3" /> Thoát
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={isAuthLoading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
        >
          {isAuthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          <span>Đăng Nhập Google</span>
        </button>
      )}

      {/* Quick Link Share Trigger */}
      <button
        onClick={onOpenShareModal}
        className={clsx(
          "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs transition-all",
          isLight 
            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
            : "bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        )}
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Gửi Khách</span>
      </button>
    </div>
  );
}
