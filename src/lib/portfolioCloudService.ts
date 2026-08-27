import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { PortfolioPosition, BrandSettings } from '../store/useStore';

export interface CloudPortfolioData {
  id: string;
  brokerUid?: string;
  brokerEmail?: string;
  brokerName?: string;
  title: string;
  positions: PortfolioPosition[];
  cashBalance: number;
  marketPrices: Record<string, number>;
  brandSettings: BrandSettings;
  portfolioStockWeight: number;
  themeMode?: 'cyber' | 'light' | 'contrast';
  brokerNotes?: string;
  updatedAt?: any;
  createdAt?: any;
}

/**
 * Clean slug string safely without throwing if non-string (like Click Event) is passed
 */
export function cleanRoomSlug(slug: any): string {
  if (typeof slug !== 'string' || !slug) {
    return 'vinh-quang';
  }
  const cleaned = slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'vinh-quang';
}

/**
 * Recursively remove all `undefined` values from an object/array so Firestore setDoc won't error
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as any;
  }
  return data;
}

/**
 * Creates or updates a broker's portfolio on Firestore Cloud
 * @param roomSlug Custom friendly slug or random ID (e.g. 'vinhquang' or 'vq-8899')
 */
export async function savePortfolioToCloud(
  roomSlug: any,
  portfolioData: Omit<CloudPortfolioData, 'id' | 'updatedAt'>
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const cleanId = cleanRoomSlug(roomSlug);
    const docRef = doc(db, 'portfolios', cleanId);

    const currentUser = auth.currentUser;

    const rawData = {
      ...portfolioData,
      id: cleanId,
      brokerUid: currentUser?.uid || 'guest_broker',
      brokerEmail: currentUser?.email || 'vinhquang@broker.vn',
      brokerName: currentUser?.displayName || portfolioData.brandSettings?.appNamePrefix || 'Môi Giới',
      brokerNotes: portfolioData.brokerNotes || '',
      updatedAt: serverTimestamp(),
    };

    // Strip all undefined properties
    const cleanData = sanitizeForFirestore(rawData);

    await setDoc(docRef, cleanData, { merge: true });

    return { success: true, id: cleanId };
  } catch (err: any) {
    console.error('Error saving portfolio to Firestore:', err);
    return { success: false, id: cleanRoomSlug(roomSlug), error: err.message || 'Lỗi lưu trữ đám mây' };
  }
}

/**
 * Fetches a portfolio from Firestore once
 */
export async function fetchPortfolioFromCloud(portfolioId: any): Promise<CloudPortfolioData | null> {
  try {
    const cleanId = cleanRoomSlug(portfolioId);
    const docRef = doc(db, 'portfolios', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CloudPortfolioData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    return null;
  }
}

/**
 * Subscribes to real-time updates of a portfolio (for Clients watching live)
 */
export function subscribeToCloudPortfolio(
  portfolioId: any,
  onUpdate: (data: CloudPortfolioData | null) => void,
  onError?: (err: any) => void
) {
  const cleanId = cleanRoomSlug(portfolioId);
  const docRef = doc(db, 'portfolios', cleanId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as CloudPortfolioData);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('Snapshot error:', err);
    if (onError) onError(err);
  });
}
