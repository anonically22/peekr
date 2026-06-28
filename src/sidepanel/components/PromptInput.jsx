import { useRef } from 'react'
import { motion } from 'framer-motion'
import useAgentStore from '../store/agentStore'
import { useSettings } from '../hooks/useSettings'

// PHASE 5 TEST — hardcoded action sequence for google.com
// Change this to test different scenarios
const TEST_ACTIONS = [
  { type: 'click', selector: 'textarea[name="q"], input[name="q"]', description: 'Click search box' },
  { type: 'type', text: 'Peekr browser automation' },
  { type: 'wait', ms: 500 },
  { type: 'click', selector: 'input[name="btnK"], button[type="submit"]', description: 'Click search button' },
]

export default function PromptInput() {
  const prompt = useAgentStore((s) => s.prompt)
  const setPrompt = useAgentStore((s) => s.setPrompt)
  const running = useAgentStore((s) => s.running)
  const addStep = useAgentStore((s) => s.addStep)
  const textareaRef = useRef(null)
  const { settings } = useSettings()

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

  // PHASE 3 TEST ONLY — remove in Phase 6
  const handleTestScreenshot = async () => {
    const stepId = Date.now().toString()

    // Add a pending step immediately so we can see the card appear
    addStep({
      id: stepId,
      screenshot: null,
      reasoning: 'taking screenshot...',
      actions: [],
      status: 'running',
    })

    // Ask service worker to take the screenshot
    chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' }, (response) => {
      if (response?.success) {
        // Update the step with the real screenshot
        useAgentStore.getState().updateStep(stepId, {
          screenshot: response.dataUrl,
          reasoning: `screenshot captured — ${new Date().toLocaleTimeString()}`,
          actions: [{ type: 'done', description: 'screenshot test complete' }],
          status: 'done',
        })
      } else {
        useAgentStore.getState().updateStep(stepId, {
          reasoning: `screenshot failed: ${response?.error || 'unknown error'}`,
          actions: [{ type: 'error' }],
          status: 'error',
        })
      }
    })
  }
  // END PHASE 3 TEST

  // PHASE 4 TEST — remove in Phase 6
  const handleTestApiCall = async () => {
    if (!prompt.trim()) {
      alert('Enter a prompt first')
      return
    }

    if (!settings.openrouterKey) {
      alert('Add your OpenRouter API key in settings first')
      return
    }

    const stepId = Date.now().toString()
    addStep({
      id: stepId,
      screenshot: null,
      reasoning: 'calling OpenRouter API...',
      actions: [],
      status: 'running',
    })

    chrome.runtime.sendMessage(
      { type: 'TEST_API_CALL', payload: { prompt, settings } },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Peekr] Runtime error:', chrome.runtime.lastError);
          useAgentStore.getState().updateStep(stepId, {
            reasoning: `Runtime error: ${chrome.runtime.lastError.message}`,
            actions: [{ type: 'error' }],
            status: 'error',
          });
          return;
        }

        if (response?.success) {
          useAgentStore.getState().updateStep(stepId, {
            screenshot: response.screenshotUrl,
            reasoning: response.result.reasoning,
            actions: response.result.actions,
            status: 'done',
          })
        } else {
          useAgentStore.getState().updateStep(stepId, {
            reasoning: response?.isRateLimit
              ? 'rate limit hit (429) — wait 60 seconds and try again'
              : `API call failed: ${response?.error || 'unknown error'}`,
            actions: [{ type: 'error' }],
            status: 'error',
          })
        }
      }
    )
  }
  // END PHASE 4 TEST

  // PHASE 5 TEST — remove in Phase 6
  const handleTestActions = async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab) { alert('No active tab found'); return }

    const stepId = Date.now().toString()
    addStep({
      id: stepId,
      screenshot: null,
      reasoning: `executing ${TEST_ACTIONS.length} test actions on tab ${tab.id}...`,
      actions: TEST_ACTIONS,
      status: 'running',
    })

    chrome.runtime.sendMessage(
      { type: 'TEST_ACTIONS', payload: { tabId: tab.id, actions: TEST_ACTIONS } },
      (response) => {
        useAgentStore.getState().updateStep(stepId, {
          reasoning: response?.success
            ? 'all test actions executed successfully'
            : `action execution failed: ${response?.error}`,
          status: response?.success ? 'done' : 'error',
        })
      }
    )
  }
  // END PHASE 5 TEST

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

      {/* PHASE 3 TEST BUTTON — remove in Phase 6 */}
      <button
        onClick={handleTestScreenshot}
        className="mt-2 w-full py-1.5 border border-white/10 rounded font-mono text-[10px] text-muted hover:text-text hover:border-white/20 transition-colors"
      >
        [phase 3 test] take screenshot
      </button>
      {/* END PHASE 3 TEST BUTTON */}

      {/* PHASE 4 TEST BUTTON — remove in Phase 6 */}
      <button
        onClick={handleTestApiCall}
        className="mt-1.5 w-full py-1.5 border border-accent/20 rounded font-mono text-[10px] text-accent/60 hover:text-accent hover:border-accent/40 transition-colors"
      >
        [phase 4 test] screenshot + ask AI
      </button>
      {/* END PHASE 4 TEST BUTTONS */}

      {/* PHASE 5 TEST BUTTON — remove in Phase 6 */}
      <button onClick={handleTestActions} className="mt-1.5 w-full py-1.5 border border-purple-400/20 rounded font-mono text-[10px] text-purple-400/60 hover:text-purple-400 hover:border-purple-400/40 transition-colors">
        [phase 5 test] run actions on page
      </button>
      {/* END TEST BUTTONS */}
    </div>
  )
}
