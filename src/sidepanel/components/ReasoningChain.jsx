import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import StepCard from './StepCard'
import useAgentStore from '../store/agentStore'

export default function ReasoningChain() {
  const steps = useAgentStore((s) => s.steps)
  const running = useAgentStore((s) => s.running)
  const bottomRef = useRef(null)

  // Auto-scroll to latest step
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">👁</span>
        <span className="text-text font-mono text-sm">ready to peekr</span>
        <span className="text-muted font-mono text-xs leading-relaxed">
          type a task below and hit go.<br />
          peekr will see your screen and do it.
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <AnimatePresence initial={false}>
        {steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
