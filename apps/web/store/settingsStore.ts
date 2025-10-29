import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  // Detection Settings
  confidenceThreshold: number;
  maxDetections: number;
  preferredXAIMethod: 'gradcam' | 'lime' | 'shap' | 'saliency';
  
  // UI Settings
  theme: 'light' | 'dark' | 'system';
  autoSaveAnalyses: boolean;
  showNotifications: boolean;
  
  // Export Settings
  defaultExportFormat: 'pdf' | 'excel';
  includeHeatmaps: boolean;
  includeMetadata: boolean;
  
  // API Settings
  backendUrl: string;
  timeout: number;
  
  // Batch Processing
  maxBatchSize: number;
  parallelProcessing: boolean;
}

interface SettingsState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  confidenceThreshold: 0.5,
  maxDetections: 10,
  preferredXAIMethod: 'gradcam',
  theme: 'light',
  autoSaveAnalyses: true,
  showNotifications: true,
  defaultExportFormat: 'pdf',
  includeHeatmaps: true,
  includeMetadata: true,
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  maxBatchSize: 10,
  parallelProcessing: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'radikal-settings',
    }
  )
);
