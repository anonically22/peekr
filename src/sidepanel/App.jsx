import { AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import ReasoningChain from './components/ReasoningChain'
import SettingsPanel from './components/SettingsPanel'
import useAgentStore from './store/agentStore'
import { useAgentLoop } from './hooks/useAgentLoop'

export default function App() {
  const settingsOpen = useAgentStore((s) => s.settingsOpen)

  // Initialize the agent loop hook at the top level
  // startAgent and stopAgent are stored in the Zustand store
  // so Header and PromptInput can access them without prop drilling
  const { startAgent, stopAgent } = useAgentLoop()

  // Store the functions in a ref on the window so child components can call them
  // This is intentional — avoids prop drilling without adding to the Zustand store
  // (startAgent/stopAgent are functions, not serializable state)
  if (typeof window !== 'undefined') {
    window.__peekrStartAgent = startAgent
    window.__peekrStopAgent = stopAgent
  }

  return (
    <div className="flex flex-col h-screen bg-base text-text font-sans overflow-hidden">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {settingsOpen ? (
            <SettingsPanel key="settings" />
          ) : (
            <ReasoningChain key="chain" />
          )}
        </AnimatePresence>
      </div>

      {!settingsOpen && <PromptInput />}
    </div>
  )
}
