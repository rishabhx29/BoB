import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  firebaseToken: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setFirebaseToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  firebaseToken: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    }),

  setFirebaseToken: (firebaseToken) => set({ firebaseToken }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      firebaseToken: null,
      isLoading: false,
    }),
}));
