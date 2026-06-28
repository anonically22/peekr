import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import StepCard from './StepCard'
import EmptyState from './EmptyState'
import useAgentStore from '../store/agentStore'

export default function ReasoningChain() {
  const steps = useAgentStore((s) => s.steps)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  if (steps.length === 0) {
    return <EmptyState />
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
