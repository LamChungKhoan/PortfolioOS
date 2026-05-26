import { create } from 'zustand';

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
};

type AppState = {
  positions: PortfolioPosition[];
  cashBalance: number;
  marketPrices: Record<string, number>;
  addPosition: (symbol: string) => void;
  updateSymbol: (id: string, symbol: string) => void;
  removePosition: (id: string) => void;
  updateBuy: (positionId: string, buyIndex: number, price: number, volume: number) => void;
  addBuy: (positionId: string) => void;
  removeBuy: (positionId: string, buyIndex: number) => void;
  setCashBalance: (amount: number) => void;
  updateDashboardInfo: (positionId: string, info: Partial<StockDashboardInfo>) => void;
  fetchLivePrices: () => Promise<void>;
  movePosition: (id: string, direction: 'up' | 'down') => void;
  toggleHighlight: (id: string) => void;
};

const initialPositions: PortfolioPosition[] = [
  {
    id: '1',
    symbol: 'FPT',
    buys: [
      { price: 85, volume: 5000 },
      { price: 90, volume: 10000 },
    ]
  },
  {
    id: '2',
    symbol: 'HPG',
    buys: [
      { price: 28, volume: 20000 },
    ]
  }
];

export const useStore = create<AppState>((set) => ({
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
  fetchLivePrices: async () => {
    const { positions, marketPrices } = useStore.getState();
    const symbols = Array.from(new Set(positions.map(p => p.symbol).filter(Boolean)));
    
    if (symbols.length === 0) return;

    try {
      const newPrices = { ...marketPrices };
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
      set({ marketPrices: newPrices });
    } catch (error) {
      console.error("Failed to fetch live prices", error);
    }
  }
}));

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
  
  const finalPositions = enrichedPositions.map(pos => ({
    ...pos,
    weightPercent: totalNav > 0 ? (pos.marketValue / totalNav) * 100 : 0
  }));

  return {
    positions: finalPositions,
    cashBalance,
    totalNav,
    totalUnrealizedPL,
  };
};
