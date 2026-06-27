import { create } from 'zustand'

const MOCK_STEPS = [
  {
    id: '1',
    screenshot: null,
    reasoning: 'I can see a search input at the top of the page. I will click it and type the query to begin the task.',
    actions: [
      { type: 'click', selector: 'input[name="q"]', description: 'Click search box' },
      { type: 'type', text: 'best pizza near me' },
    ],
    status: 'done',
  },
  {
    id: '2',
    screenshot: null,
    reasoning: 'The search results have loaded. I can see a submit button. Clicking it will navigate to results.',
    actions: [
      { type: 'click', selector: 'button[type="submit"]', description: 'Submit search' },
    ],
    status: 'done',
  },
  {
    id: '3',
    screenshot: null,
    reasoning: 'Task complete. The search results are showing as expected.',
    actions: [{ type: 'done' }],
    status: 'done',
  },
]

const useAgentStore = create((set) => ({
  // Agent state
  running: false,
  steps: MOCK_STEPS,       // swap to [] in Phase 6
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
