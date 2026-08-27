import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { PortfolioPosition, BrandSettings } from '../store/useStore';

export interface UserSavedRoom {
  id: string;
  title: string;
  updatedAt?: any;
}

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

export interface UserCloudProfile {
  uid: string;
  email: string;
  displayName?: string;
  lastActiveRoom: string;
  portfolioRooms: UserSavedRoom[];
  activePortfolio: CloudPortfolioData;
  updatedAt?: any;
}

/**
 * Clean slug string safely without throwing if non-string is passed
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
 * Saves a portfolio under the user's account and to the public room collection
 */
export async function savePortfolioToCloud(
  roomSlug: any,
  portfolioData: Omit<CloudPortfolioData, 'id' | 'updatedAt'>
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const cleanId = cleanRoomSlug(roomSlug);
    const currentUser = auth.currentUser;

    const fullPortfolio: CloudPortfolioData = {
      ...portfolioData,
      id: cleanId,
      brokerUid: currentUser?.uid || 'guest_broker',
      brokerEmail: currentUser?.email || 'vinhquang@broker.vn',
      brokerName: currentUser?.displayName || portfolioData.brandSettings?.appNamePrefix || 'Môi Giới',
      brokerNotes: portfolioData.brokerNotes || '',
      updatedAt: serverTimestamp(),
    };

    const cleanData = sanitizeForFirestore(fullPortfolio);

    // 1. Save to public rooms collection
    const publicDocRef = doc(db, 'portfolios', cleanId);
    await setDoc(publicDocRef, cleanData, { merge: true });

    // 2. If logged in with Google, also save under user document and update their portfolio rooms list
    if (currentUser?.uid) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let rooms: UserSavedRoom[] = [];
      if (userSnap.exists()) {
        const userData = userSnap.data();
        rooms = Array.isArray(userData.portfolioRooms) ? userData.portfolioRooms : [];
      }

      // Upsert current room in user's room list
      const existingIdx = rooms.findIndex(r => r.id === cleanId);
      const roomEntry: UserSavedRoom = {
        id: cleanId,
        title: portfolioData.title || cleanId,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        rooms[existingIdx] = roomEntry;
      } else {
        rooms.unshift(roomEntry);
      }

      const userProfileData = sanitizeForFirestore({
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        lastActiveRoom: cleanId,
        portfolioRooms: rooms,
        activePortfolio: cleanData,
        updatedAt: serverTimestamp()
      });

      await setDoc(userDocRef, userProfileData, { merge: true });
    }

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
 * Fetches user profile data from Firestore
 */
export async function fetchUserProfile(uid: string): Promise<UserCloudProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserCloudProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Subscribes to real-time updates for a logged-in user profile across all tabs/devices
 */
export function subscribeToUserCloud(
  uid: string,
  onUpdate: (profile: UserCloudProfile | null) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserCloudProfile);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('User snapshot error:', err);
    if (onError) onError(err);
  });
}

/**
 * Subscribes to real-time updates of a public portfolio (for Clients or Rooms watching live)
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
