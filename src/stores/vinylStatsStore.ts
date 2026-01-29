import { create } from 'zustand'
import { getVinylStats } from '../lib/vinyls'

interface VinylStats {
  collectionCount: number
  wishlistCount: number
}

interface VinylStatsStore {
  stats: VinylStats
  isInitialized: boolean
  
  // Actions
  initialize: (userId: string) => Promise<void>
  incrementCollection: () => void
  decrementCollection: () => void
  incrementWishlist: () => void
  decrementWishlist: () => void
  refresh: (userId: string) => Promise<void>
  cleanup: () => void
}

export const useVinylStatsStore = create<VinylStatsStore>((set, get) => ({
  stats: {
    collectionCount: 0,
    wishlistCount: 0,
  },
  isInitialized: false,

  initialize: async (userId: string) => {
    // Éviter les doubles initialisations
    if (get().isInitialized) {
      return
    }

    try {
      const stats = await getVinylStats(userId)
      set({ 
        stats: {
          collectionCount: stats.collectionCount,
          wishlistCount: stats.wishlistCount,
        },
        isInitialized: true,
      })
    } catch (error) {
      console.error('❌ Erreur initialisation vinyl stats:', error)
    }
  },

  incrementCollection: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        collectionCount: state.stats.collectionCount + 1,
      },
    }))
  },

  decrementCollection: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        collectionCount: Math.max(0, state.stats.collectionCount - 1),
      },
    }))
  },

  incrementWishlist: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        wishlistCount: state.stats.wishlistCount + 1,
      },
    }))
  },

  decrementWishlist: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        wishlistCount: Math.max(0, state.stats.wishlistCount - 1),
      },
    }))
  },

  refresh: async (userId: string) => {
    try {
      const stats = await getVinylStats(userId)
      set({ 
        stats: {
          collectionCount: stats.collectionCount,
          wishlistCount: stats.wishlistCount,
        },
      })
    } catch (error) {
      console.error('❌ Erreur refresh vinyl stats:', error)
    }
  },

  cleanup: () => {
    set({ 
      stats: {
        collectionCount: 0,
        wishlistCount: 0,
      },
      isInitialized: false,
    })
  },
}))