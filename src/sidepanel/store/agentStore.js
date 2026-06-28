import { create } from 'zustand'

const useAgentStore = create((set) => ({
  // Agent state
  running: false,
  steps: [],
  error: null,

  // UI state
  settingsOpen: false,
  prompt: '',

  // Actions
  setRunning: (running) => set({ running }),
  setSteps: (steps) => set({ steps }),
  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),
  updateStep: (id, patch) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
  clearSteps: () => set({ steps: [] }),
  setError: (error) => set({ error }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setPrompt: (prompt) => set({ prompt }),
}))

export default useAgentStore
