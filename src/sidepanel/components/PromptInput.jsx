import { useRef } from 'react'
import { motion } from 'framer-motion'
import useAgentStore from '../store/agentStore'

export default function PromptInput() {
  const prompt = useAgentStore((s) => s.prompt)
  const setPrompt = useAgentStore((s) => s.setPrompt)
  const running = useAgentStore((s) => s.running)
  const textareaRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGo()
    }
  }

  const handleGo = () => {
    if (!prompt.trim() || running) return
    // wired to agent in Phase 6
    console.log('GO:', prompt)
  }

  return (
    <div className="border-t border-white/10 bg-base px-3 py-3 shrink-0">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="describe what to do on this page..."
          disabled={running}
          rows={1}
          className="
            flex-1 resize-none bg-surface text-text font-mono text-sm
            placeholder-muted rounded border border-white/10
            px-3 py-2 outline-none focus:border-accent/40
            transition-colors min-h-[40px] max-h-[96px]
            disabled:opacity-50 disabled:cursor-not-allowed
            leading-relaxed
          "
          style={{ fieldSizing: 'content' }}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGo}
          disabled={!prompt.trim() || running}
          className="
            px-4 py-2 bg-accent text-base font-mono text-sm font-medium
            rounded transition-opacity
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:opacity-90 shrink-0
          "
        >
          {running ? '...' : 'go'}
        </motion.button>
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-muted font-mono text-[10px]">
          shift+enter for new line
        </span>
        <span className="text-muted font-mono text-[10px]">
          {prompt.length} chars
        </span>
      </div>
    </div>
  )
}
