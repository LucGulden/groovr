import { create } from 'zustand'
import { getUserByUid } from '../lib/user'
import type { User as AppUser } from '../types/user'

interface UserStore {
  appUser: AppUser | null
  isInitialized: boolean
  
  // Actions
  initialize: (userId: string) => Promise<void>
  setAppUser: (user: AppUser | null) => void
  updateAppUser: (updates: Partial<AppUser>) => void
  cleanup: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  appUser: null,
  isInitialized: false,

  initialize: async (userId: string) => {
    // Éviter les doubles initialisations
    if (get().isInitialized) {
      return
    }

    try {
      const user = await getUserByUid(userId)
      set({ 
        appUser: user,
        isInitialized: true,
      })
    } catch (error) {
      console.error('❌ Erreur initialisation user:', error)
    }
  },

  setAppUser: (user) => {
    set({ appUser: user })
  },

  updateAppUser: (updates) => {
    set((state) => ({
      appUser: state.appUser ? { ...state.appUser, ...updates } : null,
    }))
  },

  cleanup: () => {
    set({ 
      appUser: null,
      isInitialized: false,
    })
  },
}))