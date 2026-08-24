import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export function isVietnameseMarketHours(): boolean {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const hanoiTime = new Date(utc + (3600000 * 7));
  const hour = hanoiTime.getHours();
  const minute = hanoiTime.getMinutes();
  const minutesSinceMidnight = hour * 60 + minute;
  return minutesSinceMidnight >= (9 * 60) && minutesSinceMidnight <= (14 * 60 + 45);
}


export type BuyEntry = {
  price: number;
  volume: number;
};

export type StockDashboardInfo = {
  eps?: string;
  pe?: string;
  sharesOutstanding?: string;
  shareholders?: string;
  dividends?: string;
  catalyst?: string;
  customNotes?: string;
};

export type PortfolioPosition = {
  id: string;
  symbol: string;
  buys: BuyEntry[];
  dashboardInfo?: StockDashboardInfo;
  isHighlighted?: boolean;
  tags?: string[];
  allocationWeight?: number;
};

export type BrandSettings = {
  appNamePrefix: string;
  appNameSuffix: string;
  logoIcon: string;
  themeHue: number;
  themeSaturation: string;
  themeName: string;
};

type AppState = {
  positions: PortfolioPosition[];
  cashBalance: number;
  marketPrices: Record<string, number>;
  brandSettings: BrandSettings;
  portfolioStockWeight: number;
  lastUpdated?: string;
  isFetchingPrices?: boolean;
  boardTitle: string;
  themeMode: 'cyber' | 'light' | 'contrast';
  densityMode: 'standard' | 'compact';
  addPosition: (symbol: string) => void;
  updateSymbol: (id: string, symbol: string) => void;
  removePosition: (id: string) => void;
  updateBuy: (positionId: string, buyIndex: number, price: number, volume: number) => void;
  addBuy: (positionId: string) => void;
  removeBuy: (positionId: string, buyIndex: number) => void;
  setCashBalance: (amount: number) => void;
  updateDashboardInfo: (positionId: string, info: Partial<StockDashboardInfo>) => void;
  fetchLivePrices: (isManual?: boolean) => Promise<void>;
  movePosition: (id: string, direction: 'up' | 'down') => void;
  toggleHighlight: (id: string) => void;
  addTag: (positionId: string, tag: string) => void;
  removeTag: (positionId: string, tag: string) => void;
  setTags: (positionId: string, tags: string[]) => void;
  updateBrandSettings: (settings: Partial<BrandSettings>) => void;
  updateAllocationWeight: (id: string, weight: number) => void;
  setPortfolioStockWeight: (weight: number) => void;
  updateMarketPrice: (symbol: string, price: number) => void;
  setBoardTitle: (title: string) => void;
  setThemeMode: (mode: 'cyber' | 'light' | 'contrast') => void;
  setDensityMode: (mode: 'standard' | 'compact') => void;
};

const initialPositions: PortfolioPosition[] = [
  {
    id: '1',
    symbol: 'FPT',
    buys: [
      { price: 85, volume: 5000 },
      { price: 90, volume: 10000 },
    ],
    tags: ['Công nghệ', 'Đầu tư dài hạn'],
    allocationWeight: 60
  },
  {
    id: '2',
    symbol: 'HPG',
    buys: [
      { price: 28, volume: 20000 },
    ],
    tags: ['Thép', 'Lướt sóng T+'],
    allocationWeight: 40
  }
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      positions: initialPositions,
      cashBalance: 500000000,
      marketPrices: {
        'FPT': 112.5,
        'HPG': 30.1,
        'VCB': 92,
        'MWG': 48.5,
        'SSI': 38.2,
        'VNM': 66,
        'VIC': 45,
        'VHM': 41.5,
        'ACB': 28.5,
        'MBB': 24.5,
        'TCB': 46.8,
        'VPB': 19.5,
        'STB': 31.2,
        'PNJ': 112.5,
        'VND': 22.5,
      },
      brandSettings: {
        appNamePrefix: 'Portfolio',
        appNameSuffix: 'OS',
        logoIcon: 'LayoutDashboard',
        themeHue: 161,
        themeSaturation: '84%',
        themeName: 'emerald'
      },
      portfolioStockWeight: 80,
      lastUpdated: undefined,
      isFetchingPrices: false,
      boardTitle: 'BẢNG ĐIỀU KHIỂN',
      themeMode: 'cyber',
      densityMode: 'standard',
      setCashBalance: (amount) => set({ cashBalance: amount }),
      addPosition: (symbol) => set((state) => ({
        positions: [...state.positions, {
          id: Math.random().toString(36).substr(2, 9),
          symbol: symbol.toUpperCase(),
          buys: [{ price: 0, volume: 0 }]
        }]
      })),
      updateSymbol: (id, symbol) => set((state) => ({
        positions: state.positions.map(p => p.id === id ? { ...p, symbol: symbol.toUpperCase() } : p)
      })),
      removePosition: (id) => set((state) => ({
        positions: state.positions.filter(p => p.id !== id)
      })),
      addBuy: (positionId) => set((state) => ({
        positions: state.positions.map(p => 
          p.id === positionId ? { ...p, buys: [...p.buys, { price: 0, volume: 0 }] } : p
        )
      })),
      updateBuy: (positionId, buyIndex, price, volume) => set((state) => ({
        positions: state.positions.map(p => 
          p.id === positionId ? { 
            ...p, 
            buys: p.buys.map((b, i) => i === buyIndex ? { price, volume } : b) 
          } : p
        )
      })),
      removeBuy: (positionId, buyIndex) => set((state) => ({
        positions: state.positions.map(p => 
          p.id === positionId ? { 
            ...p, 
            buys: p.buys.filter((_, i) => i !== buyIndex) 
          } : p
        )
      })),
      updateDashboardInfo: (positionId, info) => set((state) => ({
        positions: state.positions.map(p =>
          p.id === positionId ? {
            ...p,
            dashboardInfo: { ...p.dashboardInfo, ...info }
          } : p
        )
      })),
      movePosition: (id, direction) => set((state) => {
        const idx = state.positions.findIndex(p => p.id === id);
        if (idx === -1) return {};
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= state.positions.length) return {};
        const nextPositions = [...state.positions];
        const temp = nextPositions[idx];
        nextPositions[idx] = nextPositions[newIdx];
        nextPositions[newIdx] = temp;
        return { positions: nextPositions };
      }),
      toggleHighlight: (id) => set((state) => ({
        positions: state.positions.map(p =>
          p.id === id ? { ...p, isHighlighted: !p.isHighlighted } : p
        )
      })),
      addTag: (positionId, tag) => set((state) => ({
        positions: state.positions.map(p =>
          p.id === positionId
            ? { ...p, tags: Array.from(new Set([...(p.tags || []), tag.trim()])) }
            : p
        )
      })),
      removeTag: (positionId, tag) => set((state) => ({
        positions: state.positions.map(p =>
          p.id === positionId
            ? { ...p, tags: (p.tags || []).filter(t => t !== tag) }
            : p
        )
      })),
      setTags: (positionId, tags) => set((state) => ({
        positions: state.positions.map(p =>
          p.id === positionId
            ? { ...p, tags: tags.map(t => t.trim()).filter(Boolean) }
            : p
        )
      })),
      updateBrandSettings: (settings) => set((state) => ({
        brandSettings: { ...state.brandSettings, ...settings }
      })),
      updateAllocationWeight: (id, weight) => set((state) => ({
        positions: state.positions.map(p => p.id === id ? { ...p, allocationWeight: weight } : p)
      })),
      setPortfolioStockWeight: (weight) => set({ portfolioStockWeight: weight }),
      updateMarketPrice: (symbol, price) => set((state) => ({
        marketPrices: {
          ...state.marketPrices,
          [symbol.toUpperCase()]: price
        }
      })),
      fetchLivePrices: async (isManual = false) => {
        if (!isManual && isVietnameseMarketHours()) {
          console.log("Skipping automated price refresh during Vietnamese market hours (09:00 - 14:45) to preserve manual edits.");
          return;
        }

        const { positions, marketPrices } = useStore.getState();
        const symbols = Array.from(new Set(positions.map(p => p.symbol).filter(Boolean)));
        
        set({ isFetchingPrices: true });

        try {
          const newPrices = { ...marketPrices };
          if (symbols.length > 0) {
            await Promise.all(symbols.map(async (symbol) => {
              try {
                const res = await fetch(`/api/stock/${symbol}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data && data.price !== undefined) {
                    newPrices[symbol] = data.price / 1000;
                  }
                }
              } catch (e) {
                // Silent catch for individual fetch failures
              }
            }));
          }
          
          const now = new Date();
          const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          
          set({ 
            marketPrices: newPrices, 
            isFetchingPrices: false,
            lastUpdated: `${timeStr} ${dateStr}`
          });
        } catch (error) {
          console.error("Failed to fetch live prices", error);
          set({ isFetchingPrices: false });
        }
      },
      setBoardTitle: (title) => set({ boardTitle: title }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setDensityMode: (mode) => set({ densityMode: mode }),
    }),
    {
      name: 'portfolio-storage',
      partialize: (state) => ({
        positions: state.positions,
        cashBalance: state.cashBalance,
        brandSettings: state.brandSettings,
        portfolioStockWeight: state.portfolioStockWeight,
        lastUpdated: state.lastUpdated,
        marketPrices: state.marketPrices,
        boardTitle: state.boardTitle,
        themeMode: state.themeMode,
        densityMode: state.densityMode,
      }),
    }
  )
);

export const useDerivedPortfolio = () => {
  const positions = useStore(state => state.positions);
  const cashBalance = useStore(state => state.cashBalance);
  const marketPrices = useStore(state => state.marketPrices);

  const enrichedPositions = positions.map(pos => {
    const totalVolume = pos.buys.reduce((sum, b) => sum + (b.volume || 0), 0);
    const totalCost = pos.buys.reduce((sum, b) => sum + ((b.price || 0) * (b.volume || 0) * 1000), 0);
    const averageCost = totalVolume > 0 ? pos.buys.reduce((sum, b) => sum + ((b.price || 0) * (b.volume || 0)), 0) / totalVolume : 0;
    
    // Fallback to average cost if market price is not set yet
    const currentPrice = marketPrices[pos.symbol] !== undefined ? marketPrices[pos.symbol] : averageCost;
    const marketValue = totalVolume * currentPrice * 1000;
    const unrealizedPL = marketValue - totalCost;
    const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

    return {
      ...pos,
      totalVolume,
      totalCost,
      averageCost,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent
    };
  });

  const totalMarketValue = enrichedPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalNav = cashBalance + totalMarketValue;
  const totalCostAll = enrichedPositions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalUnrealizedPL = totalMarketValue - totalCostAll;
  
  const totalWeight = positions.reduce((sum, p) => sum + (p.allocationWeight !== undefined ? p.allocationWeight : 0), 0);
  
  const finalPositions = enrichedPositions.map(pos => {
    let weightPercent = 0;
    if (totalWeight > 0) {
      weightPercent = ((pos.allocationWeight !== undefined ? pos.allocationWeight : 0) / totalWeight) * 100;
    } else if (positions.length > 0) {
      weightPercent = 100 / positions.length;
    }
    return {
      ...pos,
      weightPercent
    };
  });

  let portfolioPLPercent = 0;
  finalPositions.forEach(p => {
    portfolioPLPercent += (p.weightPercent / 100) * p.unrealizedPLPercent;
  });

  return {
    positions: finalPositions,
    cashBalance,
    totalNav,
    totalUnrealizedPL,
    portfolioPLPercent,
  };
};
