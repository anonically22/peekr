import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACTION_COLORS = {
  click:    'text-blue-400 border-blue-400/30 bg-blue-400/10',
  type:     'text-purple-400 border-purple-400/30 bg-purple-400/10',
  scroll:   'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  navigate: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  select:   'text-orange-400 border-orange-400/30 bg-orange-400/10',
  wait:     'text-muted border-white/10 bg-white/5',
  done:     'text-accent border-accent/30 bg-accent/10',
  error:    'text-danger border-danger/30 bg-danger/10',
}

function ActionPill({ action }) {
  const colorClass = ACTION_COLORS[action.type] || ACTION_COLORS.wait
  const label = action.description || action.text || action.selector || action.type

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] ${colorClass}`}>
      <span className="opacity-60">{action.type}</span>
      {label !== action.type && (
        <>
          <span className="opacity-30">·</span>
          <span className="truncate max-w-[120px]">{label}</span>
        </>
      )}
    </span>
  )
}

function ScreenshotModal({ src, onClose }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <motion.img
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            src={src}
            alt="Screenshot full size"
            className="max-w-full max-h-full rounded border border-white/10 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white font-mono text-xs"
          >
            ✕ close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function StepCard({ step, index }) {
  const [modalOpen, setModalOpen] = useState(false)

  const statusColor = {
    pending: 'bg-muted',
    running: 'bg-accent',
    done:    'bg-accent/50',
    error:   'bg-danger',
  }[step.status] || 'bg-muted'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-surface border border-white/10 rounded-lg overflow-hidden"
      >
        {/* Step header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
          <span className="text-muted font-mono text-[10px]">step {index + 1}</span>
          {step.status === 'running' && (
            <motion.span
              className="text-accent font-mono text-[10px]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              running...
            </motion.span>
          )}
          {step.status === 'error' && (
            <span className="text-danger font-mono text-[10px]">failed</span>
          )}
        </div>

        <div className="p-3 flex flex-col gap-3">
          {/* Screenshot */}
          {step.screenshot ? (
            <div className="relative group cursor-zoom-in" onClick={() => setModalOpen(true)}>
              <img
                src={step.screenshot}
                alt={`Step ${index + 1}`}
                className="w-full rounded border border-white/10 group-hover:border-white/20 transition-colors"
                style={{ height: '80px', objectFit: 'cover', objectPosition: 'top' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                <span className="text-white/0 group-hover:text-white/70 font-mono text-[10px] transition-colors">
                  click to expand
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-16 rounded bg-white/5 border border-white/5 flex items-center justify-center">
              <span className="text-muted font-mono text-[10px]">no screenshot</span>
            </div>
          )}

          {/* Reasoning */}
          <p className="text-text font-mono text-xs leading-relaxed">
            {step.reasoning}
          </p>

          {/* Action pills */}
          {step.actions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {step.actions.map((action, i) => (
                <ActionPill key={i} action={action} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Screenshot modal — rendered outside the card via portal-like pattern */}
      {modalOpen && (
        <ScreenshotModal
          src={step.screenshot}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
