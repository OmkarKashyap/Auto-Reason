// src/store/authStore.ts
import { create } from 'zustand';
import { getMe } from '@/lib/api';
import { Owner } from '@/lib/types';

interface AuthState {
  owner: Owner | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  owner: null,
  isLoading: true,
  refresh: async () => {
    set({ isLoading: true });
    try {
      const owner = await getMe();
      set({ owner, isLoading: false });
    } catch {
      set({ owner: null, isLoading: false });
    }
  },
  clear: () => set({ owner: null }),
}));
