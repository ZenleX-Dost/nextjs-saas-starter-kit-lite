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
        const newEntry: AnalysisHistory = {
          ...analysis,
          id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 100), // Keep last 100
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
    }
  )
);
