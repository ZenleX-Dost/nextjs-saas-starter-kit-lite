import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DetectionResponse, ExplanationResponse } from '~/types';

export interface AnalysisHistory {
  id: string;
  timestamp: Date;
  imageName: string;
  imageUrl: string;
  detections: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  result: DetectionResponse;
  explanation?: ExplanationResponse;
}

interface AnalysisState {
  currentImage: File | null;
  currentImageUrl: string | null;
  detectionResult: DetectionResponse | null;
  explanationResult: ExplanationResponse | null;
  isProcessing: boolean;
  error: string | null;
  history: AnalysisHistory[];
  
  setImage: (file: File, url: string) => void;
  setDetectionResult: (result: DetectionResponse) => void;
  setExplanationResult: (result: ExplanationResponse) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  clearAnalysis: () => void;
  addToHistory: (analysis: Omit<AnalysisHistory, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      currentImage: null,
      currentImageUrl: null,
      detectionResult: null,
      explanationResult: null,
      isProcessing: false,
      error: null,
      history: [],

      setImage: (file, url) => {
        set({
          currentImage: file,
          currentImageUrl: url,
          detectionResult: null,
          explanationResult: null,
          error: null,
        });
      },

      setDetectionResult: (result) => {
        set({ detectionResult: result });
      },

      setExplanationResult: (result) => {
        set({ explanationResult: result });
      },

      setIsProcessing: (isProcessing) => {
        set({ isProcessing });
      },

      setError: (error) => {
        set({ error });
      },

      clearAnalysis: () => {
        set({
          currentImage: null,
          currentImageUrl: null,
          detectionResult: null,
          explanationResult: null,
          isProcessing: false,
          error: null,
        });
      },

      addToHistory: (analysis) => {
        // Create a lightweight version without large base64 data
        const lightweightAnalysis = {
          ...analysis,
          // Remove base64 image to save space
          imageUrl: '', // Don't store base64 images in localStorage
          // Keep only essential detection info, remove large data
          result: {
            ...analysis.result,
            // Remove any base64 images from detections
            detections: analysis.result.detections.map(d => ({
              ...d,
              mask_base64: null, // Remove segmentation masks
            })),
          },
          // Remove large heatmap data from explanations
          explanation: analysis.explanation ? {
            ...analysis.explanation,
            explanations: analysis.explanation.explanations.map(e => ({
              ...e,
              heatmap_base64: '', // Remove base64 heatmaps
            })),
            aggregated_heatmap: '', // Remove aggregated heatmap
          } : undefined,
        };
        
        const newEntry: AnalysisHistory = {
          ...lightweightAnalysis,
          id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 50), // Keep last 50 (reduced from 100)
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: 'radikal-analysis',
      partialize: (state) => ({
        history: state.history,
      }),
      // Handle storage errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate analysis store:', error);
          // Clear corrupted data
          try {
            localStorage.removeItem('radikal-analysis');
          } catch (e) {
            console.error('Failed to clear storage:', e);
          }
        }
      },
      // Add storage error handling
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.error('localStorage getItem error:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('localStorage setItem error (quota exceeded?):', error);
            // If quota exceeded, clear old data and retry
            try {
              localStorage.removeItem(name);
              localStorage.setItem(name, JSON.stringify(value));
            } catch (retryError) {
              console.error('Failed to save even after clearing:', retryError);
              // Last resort: clear all localStorage
              localStorage.clear();
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('localStorage removeItem error:', error);
          }
        },
      },
    }
  )
);
