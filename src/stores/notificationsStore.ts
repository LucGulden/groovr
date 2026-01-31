import { create } from 'zustand'
import { getUnreadCount, subscribeToNotifications } from '../lib/notifications'

interface NotificationsStore {
  unreadCount: number
  isInitialized: boolean
  
  // Actions
  initialize: (userId: string) => Promise<void>
  increment: () => void
  reset: () => void
  cleanup: () => void
  
  // Internal
  unsubscribe: (() => void) | null
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  unreadCount: 0,
  isInitialized: false,
  unsubscribe: null,

  initialize: async (userId: string) => {
    // ✅ Cleanup d'abord si déjà initialisé
    const { isInitialized, unsubscribe } = get()
    if (isInitialized && unsubscribe) {
      console.log('🧹 Cleaning up existing subscription before reinit')
      unsubscribe()
    }

    try {
      // 1. Charger le count initial
      const count = await getUnreadCount(userId)
      set({ unreadCount: count })

      // 2. Subscribe aux nouvelles notifications en temps réel
      const unsubscribeFn = subscribeToNotifications(
        userId,
        async () => {
          // ✅ Recharger le count complet (plus robuste que increment)
          const newCount = await getUnreadCount(userId)
          set({ unreadCount: newCount })
        },
        (error) => {
          console.error('❌ Erreur subscription notifications:', error)
        },
      )

      // 3. Stocker la fonction unsubscribe pour cleanup
      set({
        unsubscribe: unsubscribeFn,
        isInitialized: true,
      })

    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error)
    }
  },

  increment: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }))
  },

  reset: () => {
    set({ unreadCount: 0 })
  },

  cleanup: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
      set({ 
        unsubscribe: null, 
        isInitialized: false,
        unreadCount: 0,
      })
    }
  },
}))