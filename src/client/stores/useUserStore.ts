/**
 * User authentication store
 * Manages user login state and session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  username: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (username: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      setUser: (username) =>
        set({ username, isLoggedIn: true, error: null }),

      clearUser: () =>
        set({ username: null, isLoggedIn: false }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error, isLoading: false }),
    }),
    {
      name: 'subway-user',
      partialize: (state) => ({
        username: state.username,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
