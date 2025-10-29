/**
 * Zustand store for authentication state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // TODO: Implement real authentication with Makerkit
        // For now, mock implementation
        try {
          // Mock API call
          const mockUser: User = {
            id: '1',
            email: email,
            name: 'Demo User',
          };
          const mockToken = 'mock_jwt_token';

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
