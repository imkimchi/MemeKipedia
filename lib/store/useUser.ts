import { create } from 'zustand'
import { User } from '@/lib/types'

interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  initUser: (wallet: string) => Promise<void>
}

export const useUser = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  initUser: async (wallet: string) => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet }),
      })

      const data = await response.json()

      if (data.user) {
        set({ user: data.user, isLoading: false })
      } else {
        set({ user: null, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to init user:', error)
      set({ user: null, isLoading: false })
    }
  },
}))
