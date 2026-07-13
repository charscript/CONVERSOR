import { create } from 'zustand';
import { api } from '../api/client';

export const useAppStore = create((set, get) => ({
  workspacePath: '',
  config: {
    name: 'Sin Proyecto',
    bpm: 120.0,
    key: 'C Minor',
    time_sig: '4/4',
    sample_rate: 48000.0,
    bit_depth: '24-bit',
    markers: [],
    tracks: [],
    notes: []
  },
  detectedPt: null,
  detectedFlp: null,
  wavFiles: [],
  ptFiles: [],
  flpFiles: [],
  ptsl: { connected: false },
  
  // UI State
  viewMode: 'wizard', // 'wizard' or 'expert'
  currentStep: 1,
  isLoading: false,
  error: null,
  
  // Actions
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  setScanResults: (data) => set({
    config: data.config || get().config,
    detectedPt: data.detected_pt || null,
    detectedFlp: data.detected_flp || null,
    wavFiles: data.wav_files || [],
    ptFiles: data.pt_files || [],
    flpFiles: data.flp_files || [],
    ptsl: data.ptsl || { connected: false }
  }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Async API Actions
  scanWorkspace: async () => {
    const path = get().workspacePath;
    if (!path) return;
    
    set({ isLoading: true, error: null });
    try {
      const data = await api.scanWorkspace(path);
      get().setScanResults(data);
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
  
  chooseDirectory: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.chooseDirectory();
      if (data && data.path) {
        set({ workspacePath: data.path });
      }
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  }
}));
