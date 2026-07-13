import { create } from 'zustand';

export const useAppStore = create((set) => ({
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
  
  // Actions
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  setScanResults: (data) => set({
    config: data.config,
    detectedPt: data.detected_pt,
    detectedFlp: data.detected_flp,
    wavFiles: data.wav_files,
    ptFiles: data.pt_files,
    flpFiles: data.flp_files,
    ptsl: data.ptsl
  }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
}));
