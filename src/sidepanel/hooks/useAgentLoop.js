import { useEffect, useRef, useCallback } from 'react'
import useAgentStore from '../store/agentStore'

export function useAgentLoop() {
  const portRef = useRef(null)
  const {
    setRunning,
    addStep,
    setError,
    clearSteps,
    setPrompt,
    setRateLimitRetryAt,
  } = useAgentStore()

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'peekr-agent' })
    portRef.current = port

    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'AGENT_STEP':
          addStep(message.payload.step)
          break

        case 'AGENT_DONE':
          setRunning(false)
          setRateLimitRetryAt(null)
          break

        case 'AGENT_ERROR':
          setRunning(false)
          if (message.payload.isRateLimit) {
            const retryAfter = message.payload.retryAfter || 60
            setRateLimitRetryAt(Date.now() + retryAfter * 1000)
            setError(null) // rate limit shown by countdown, not error banner
          } else {
            setError(message.payload.error)
            setRateLimitRetryAt(null)
          }
          addStep({
            id: Date.now().toString(),
            screenshot: null,
            reasoning: message.payload.isRateLimit
              ? `rate limit hit — auto-retrying in ${message.payload.retryAfter || 60}s`
              : `stopped: ${message.payload.error}`,
            actions: [{ type: message.payload.isRateLimit ? 'wait' : 'error' }],
            status: message.payload.isRateLimit ? 'pending' : 'error',
          })
          break

        default:
          break
      }
    })

    port.onDisconnect.addListener(() => {
      setRunning(false)
      portRef.current = null
    })

    return () => {
      port.disconnect()
      portRef.current = null
    }
  }, [])

  const startAgent = useCallback(async (prompt, settings) => {
    if (!portRef.current) {
      setError('No connection to service worker. Try reloading the extension.')
      return
    }

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab) {
      setError('No active tab found.')
      return
    }

    clearSteps()
    setError(null)
    setRateLimitRetryAt(null)
    setRunning(true)
    setPrompt('')

    portRef.current.postMessage({
      type: 'START_AGENT',
      payload: { prompt, settings, tabId: tab.id },
    })
  }, [])

  const stopAgent = useCallback(() => {
    portRef.current?.postMessage({ type: 'STOP_AGENT' })
  }, [])

  return { startAgent, stopAgent }
}
