import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RateLimitCountdown({ retryAfter = 60, onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter)

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const progress = ((retryAfter - secondsLeft) / retryAfter) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-3 mt-3 p-3 bg-surface border border-white/10 rounded-lg"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-text font-mono text-xs font-medium">
            rate limit hit
          </span>
          <span className="text-muted font-mono text-[10px]">
            openrouter free tier
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted hover:text-text font-mono text-[10px] transition-colors"
        >
          dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-white/40 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className="text-muted font-mono text-[10px]">
          {secondsLeft > 0
            ? `auto-retrying in ${secondsLeft}s...`
            : 'retrying now...'}
        </span>
        <span className="text-muted font-mono text-[10px]">
          200 req/day limit
        </span>
      </div>
    </motion.div>
  )
}
