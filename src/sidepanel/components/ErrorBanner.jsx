import { motion, AnimatePresence } from 'framer-motion'
import useAgentStore from '../store/agentStore'

export default function ErrorBanner() {
  const error = useAgentStore((s) => s.error)
  const setError = useAgentStore((s) => s.setError)

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mx-3 mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start justify-between gap-2">
            <p className="text-danger font-mono text-[10px] leading-relaxed flex-1">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-danger/60 hover:text-danger font-mono text-[10px] shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
