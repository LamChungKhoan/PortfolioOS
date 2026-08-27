import LZString from 'lz-string';
import { PortfolioPosition, BrandSettings } from '../store/useStore';

export interface SharedPortfolioPayload {
  v: number; // version
  title: string;
  positions: PortfolioPosition[];
  cashBalance: number;
  marketPrices: Record<string, number>;
  brandSettings: BrandSettings;
  portfolioStockWeight: number;
  themeMode?: 'cyber' | 'light' | 'contrast';
  createdDate?: string;
  brokerNotes?: string;
}

/**
 * Compresses portfolio data into an ultra-compact URL-safe hash string
 */
export function encodePortfolioToUrl(payload: SharedPortfolioPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return compressed;
  } catch (err) {
    console.error('Failed to encode portfolio:', err);
    return '';
  }
}

/**
 * Decompresses and validates a portfolio payload from a URL-safe hash string
 */
export function decodePortfolioFromUrl(encoded: string): SharedPortfolioPayload | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) return null;
    const data = JSON.parse(decompressed) as SharedPortfolioPayload;
    if (data && Array.isArray(data.positions)) {
      return data;
    }
    return null;
  } catch (err) {
    console.error('Failed to decode portfolio:', err);
    return null;
  }
}

/**
 * Builds the full public shareable URL
 */
export function generateShareUrl(payload: SharedPortfolioPayload): string {
  const code = encodePortfolioToUrl(payload);
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#share=${code}`;
}
