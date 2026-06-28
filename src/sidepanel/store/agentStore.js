import { create } from 'zustand'

const useAgentStore = create((set) => ({
  running: false,
  steps: [],
  error: null,
  rateLimitRetryAt: null,   // timestamp (Date.now() + retryAfter * 1000) or null

  settingsOpen: false,
  prompt: '',

  setRunning: (running) => set({ running }),
  setSteps: (steps) => set({ steps }),
  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),
  updateStep: (id, patch) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
  clearSteps: () => set({ steps: [] }),
  setError: (error) => set({ error }),
  setRateLimitRetryAt: (ts) => set({ rateLimitRetryAt: ts }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setPrompt: (prompt) => set({ prompt }),
}))

export default useAgentStore
