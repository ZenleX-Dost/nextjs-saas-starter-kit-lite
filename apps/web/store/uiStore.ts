import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentModal: string | null;
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage: string | null;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  currentModal: null,
  toasts: [],
  isLoading: false,
  loadingMessage: null,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  openModal: (modal) => {
    set({ currentModal: modal });
  },

  closeModal: () => {
    set({ currentModal: null });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  setLoading: (isLoading, message) => {
    set({ isLoading, loadingMessage: message || null });
  },
}));
