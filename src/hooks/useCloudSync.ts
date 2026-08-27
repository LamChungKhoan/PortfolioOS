import { useEffect, useRef } from 'react';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { 
  fetchUserProfile, 
  subscribeToUserCloud, 
  savePortfolioToCloud, 
  cleanRoomSlug,
  UserCloudProfile 
} from '../lib/portfolioCloudService';
import { useStore } from '../store/useStore';

export function useCloudSync() {
  const {
    currentUser,
    setCurrentUser,
    activeRoomId,
    setActiveRoomId,
    setCloudSyncStatus,
    setUserSavedRooms,
    loadCloudState,
    positions,
    cashBalance,
    marketPrices,
    brandSettings,
    boardTitle,
    portfolioStockWeight,
    themeMode,
    brokerNotes,
  } = useStore();

  const isInitialLoadDone = useRef(false);
  const isRemoteUpdating = useRef(false);
  const debounceTimerRef = useRef<any>(null);

  // 1. Auth Listener & Initial Hydration
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
        };
        setCurrentUser(appUser);
        setCloudSyncStatus('saving');

        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          if (profile) {
            if (profile.portfolioRooms && Array.isArray(profile.portfolioRooms)) {
              setUserSavedRooms(profile.portfolioRooms);
            }

            // Hydrate state from user cloud profile
            if (profile.activePortfolio) {
              isRemoteUpdating.current = true;
              loadCloudState(profile.activePortfolio);
              if (profile.lastActiveRoom) {
                setActiveRoomId(profile.lastActiveRoom);
              }
              setTimeout(() => {
                isRemoteUpdating.current = false;
              }, 500);
            }
          }
          setCloudSyncStatus('synced');
        } catch (err) {
          console.error('Failed to load user cloud profile:', err);
          setCloudSyncStatus('error');
        }

        isInitialLoadDone.current = true;
      } else {
        setCurrentUser(null);
        setCloudSyncStatus('offline');
        isInitialLoadDone.current = true;
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Subscription to Logged-in User Profile (Multi-Tab Sync)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribeRealtime = subscribeToUserCloud(currentUser.uid, (profile: UserCloudProfile | null) => {
      if (!profile) return;

      if (profile.portfolioRooms) {
        setUserSavedRooms(profile.portfolioRooms);
      }

      // If updated remotely by another tab
      if (profile.activePortfolio && !isRemoteUpdating.current) {
        // Prevent feedback loop
        isRemoteUpdating.current = true;
        loadCloudState(profile.activePortfolio);
        if (profile.lastActiveRoom && profile.lastActiveRoom !== activeRoomId) {
          setActiveRoomId(profile.lastActiveRoom);
        }
        setTimeout(() => {
          isRemoteUpdating.current = false;
        }, 500);
      }
    });

    return () => unsubscribeRealtime();
  }, [currentUser?.uid]);

  // 3. Debounced Auto-save to Cloud whenever Broker edits portfolio
  useEffect(() => {
    if (!currentUser?.uid || !isInitialLoadDone.current || isRemoteUpdating.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setCloudSyncStatus('saving');

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const targetSlug = cleanRoomSlug(activeRoomId || brandSettings?.appNamePrefix || 'portfolio');
        const res = await savePortfolioToCloud(targetSlug, {
          title: boardTitle,
          positions,
          cashBalance,
          marketPrices,
          brandSettings,
          portfolioStockWeight,
          themeMode,
          brokerNotes: brokerNotes || '',
        });

        if (res.success) {
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('error');
        }
      } catch (e) {
        console.error('Auto cloud sync failed:', e);
        setCloudSyncStatus('error');
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    currentUser?.uid,
    activeRoomId,
    positions,
    cashBalance,
    marketPrices,
    brandSettings,
    boardTitle,
    portfolioStockWeight,
    themeMode,
    brokerNotes,
  ]);

  return {
    currentUser,
  };
}
