import { AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import ReasoningChain from './components/ReasoningChain'
import SettingsPanel from './components/SettingsPanel'
import ErrorBanner from './components/ErrorBanner'
import RateLimitCountdown from './components/RateLimitCountdown'
import useAgentStore from './store/agentStore'
import { useAgentLoop } from './hooks/useAgentLoop'

export default function App() {
  const settingsOpen = useAgentStore((s) => s.settingsOpen)
  const rateLimitRetryAt = useAgentStore((s) => s.rateLimitRetryAt)
  const setRateLimitRetryAt = useAgentStore((s) => s.setRateLimitRetryAt)

  const { startAgent, stopAgent } = useAgentLoop()

  if (typeof window !== 'undefined') {
    window.__peekrStartAgent = startAgent
    window.__peekrStopAgent = stopAgent
  }

  const rateLimitSecondsLeft = rateLimitRetryAt
    ? Math.max(0, Math.ceil((rateLimitRetryAt - Date.now()) / 1000))
    : null

  return (
    <div className="flex flex-col h-screen bg-base text-text font-sans overflow-hidden">
      <Header />

      <ErrorBanner />

      <AnimatePresence>
        {rateLimitRetryAt && rateLimitSecondsLeft > 0 && (
          <RateLimitCountdown
            key="rate-limit"
            retryAfter={rateLimitSecondsLeft}
            onDismiss={() => setRateLimitRetryAt(null)}
          />
        )}
      </AnimatePresence>

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
