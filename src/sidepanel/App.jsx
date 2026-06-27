import { AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import ReasoningChain from './components/ReasoningChain'
import SettingsPanel from './components/SettingsPanel'
import useAgentStore from './store/agentStore'

export default function App() {
  const settingsOpen = useAgentStore((s) => s.settingsOpen)

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
