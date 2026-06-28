import { motion, AnimatePresence } from 'framer-motion'
import useAgentStore from '../store/agentStore'

export default function Header() {
  const running = useAgentStore((s) => s.running)
  const setSettingsOpen = useAgentStore((s) => s.setSettingsOpen)
  const settingsOpen = useAgentStore((s) => s.settingsOpen)

  const handleStop = () => {
    window.__peekrStopAgent?.()
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-base shrink-0">

      {/* Wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-accent text-lg font-medium tracking-tight">
          peekr
        </span>
        {running && (
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {running && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleStop}
              className="px-3 py-1 text-xs text-danger border border-danger/40 rounded hover:bg-danger/10 transition-colors"
            >
              stop
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="text-muted hover:text-text transition-colors p-1"
          aria-label="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
