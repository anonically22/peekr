import { captureScreenshot } from '../services/screenshotService.js'
import { callOpenRouter, RateLimitError } from '../services/openrouterApi.js'
import { executeActions } from '../services/actionExecutor.js'
import { detachDebugger } from '../services/debuggerService.js'

// Open side panel when toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

// ─── Port Connection ────────────────────────────────────────────────────────
// The side panel connects via a persistent port so we can push messages
// during the agent loop without waiting for request/response pairs.

let activePort = null
let stopRequested = false

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'peekr-agent') return

  activePort = port
  stopRequested = false

  port.onMessage.addListener((message) => {
    if (message.type === 'START_AGENT') {
      const { prompt, settings, tabId } = message.payload
      runAgentLoop({ prompt, settings, tabId })
    }

    if (message.type === 'STOP_AGENT') {
      stopRequested = true
    }
  })

  port.onDisconnect.addListener(() => {
    stopRequested = true
    activePort = null
  })
})

// ─── Push message to side panel ────────────────────────────────────────────

function pushToPanel(type, payload = {}) {
  if (activePort) {
    try {
      activePort.postMessage({ type, payload })
    } catch (err) {
      console.warn('[Peekr] Failed to push message to panel:', err.message)
    }
  }
}

// ─── Agent Loop ─────────────────────────────────────────────────────────────

async function runAgentLoop({ prompt, settings, tabId }) {
  const maxSteps = settings.maxSteps || 15
  const stepDelay = settings.stepDelay || 3000

  let stepCount = 0
  let history = []

  console.log(`[Peekr] Starting agent loop. Task: "${prompt}"`)

  try {
    while (true) {

      // ── Stop check ──────────────────────────────────────────────────────
      if (stopRequested) {
        console.log('[Peekr] Stop requested — ending loop')
        pushToPanel('AGENT_DONE', { totalSteps: stepCount })
        break
      }

      // ── Max steps check ─────────────────────────────────────────────────
      if (stepCount >= maxSteps) {
        console.log(`[Peekr] Max steps (${maxSteps}) reached — ending loop`)
        pushToPanel('AGENT_ERROR', {
          error: `Reached the maximum of ${maxSteps} steps without completing the task. Try a more specific prompt or increase max steps in settings.`,
          isRateLimit: false,
        })
        break
      }

      // ── Step 1: Screenshot ───────────────────────────────────────────────
      let screenshotUrl
      try {
        screenshotUrl = await captureScreenshot()
      } catch (err) {
        pushToPanel('AGENT_ERROR', { error: `Screenshot failed: ${err.message}` })
        break
      }

      // ── Step 2: Call OpenRouter ──────────────────────────────────────────
      let aiResponse
      try {
        aiResponse = await callOpenRouter({
          apiKey: settings.openrouterKey,
          model: settings.model,
          screenshotUrl,
          userPrompt: prompt,
          profile: settings.profile,
          history,
        })
      } catch (err) {
        if (err.name === 'RateLimitError') {
          pushToPanel('AGENT_ERROR', {
            error: 'Rate limit hit. Wait 60 seconds then try again.',
            isRateLimit: true,
            retryAfter: 60,
          })
        } else {
          pushToPanel('AGENT_ERROR', { error: `AI call failed: ${err.message}` })
        }
        break
      }

      // ── Step 3: Build step object and push to UI ─────────────────────────
      const stepId = `step-${Date.now()}`
      const step = {
        id: stepId,
        screenshot: screenshotUrl,
        reasoning: aiResponse.reasoning,
        actions: aiResponse.actions,
        status: 'done',
      }

      pushToPanel('AGENT_STEP', { step })

      // ── Step 4: Check for terminal actions ───────────────────────────────
      const hasDone = aiResponse.actions.some(
        (a) => a.type?.toLowerCase() === 'done'
      )
      const hasError = aiResponse.actions.some((a) => a.type === 'error')

      if (hasDone) {
        console.log('[Peekr] Agent returned done — task complete')
        pushToPanel('AGENT_DONE', { totalSteps: stepCount + 1 })
        break
      }

      if (hasError) {
        const errorAction = aiResponse.actions.find((a) => a.type === 'error')
        pushToPanel('AGENT_ERROR', {
          error: errorAction.message || 'Agent could not complete the task.',
        })
        break
      }

      // ── Step 5: Execute actions ──────────────────────────────────────────
      try {
        // Filter out non-executable action types before passing to executor
        const executableActions = aiResponse.actions.filter(
          (a) => !['done', 'error'].includes(a.type)
        )
        if (executableActions.length > 0) {
          await executeActions(tabId, executableActions)
        }
      } catch (err) {
        pushToPanel('AGENT_ERROR', { error: `Action failed: ${err.message}` })
        break
      }

      // ── Step 6: Update conversation history ──────────────────────────────
      // Store the user message (screenshot + prompt) and assistant response
      // in OpenAI message format for multi-turn context
      const userMessage = {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: screenshotUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: stepCount === 0
              ? `Task: ${prompt}`
              : `Continue the task. Here is the current page.`,
          },
        ],
      }

      const assistantMessage = {
        role: 'assistant',
        // Store raw JSON string — this is what OpenRouter expects in history
        content: JSON.stringify(aiResponse),
      }

      // Cap history to last 10 turns (20 messages) to avoid exceeding context limits
      if (history.length >= 18) {
        history = history.slice(history.length - 18)
      }
      history.push(userMessage)
      history.push(assistantMessage)

      // ── Step 7: Increment and delay ──────────────────────────────────────
      stepCount++
      await sleep(stepDelay)
    }

  } finally {
    // Always detach the debugger when the loop ends, regardless of reason
    await detachDebugger()
    console.log('[Peekr] Agent loop ended. Steps completed:', stepCount)
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
