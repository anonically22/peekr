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
  } = useAgentStore()

  // Connect to the service worker port on mount
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'peekr-agent' })
    portRef.current = port

    // Handle messages pushed from the service worker during the loop
    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'AGENT_STEP':
          addStep(message.payload.step)
          break

        case 'AGENT_DONE':
          setRunning(false)
          break

        case 'AGENT_ERROR':
          setRunning(false)
          setError(message.payload.error)
          // Add a final error step to the chain so the user can see what failed
          addStep({
            id: Date.now().toString(),
            screenshot: null,
            reasoning: message.payload.isRateLimit
              ? `rate limit hit — wait ${message.payload.retryAfter || 60} seconds then try again`
              : `stopped: ${message.payload.error}`,
            actions: [{ type: 'error', message: message.payload.error }],
            status: 'error',
          })
          break

        default:
          break
      }
    })

    port.onDisconnect.addListener(() => {
      // Service worker may disconnect if it goes idle
      // Reset running state just in case
      setRunning(false)
      portRef.current = null
    })

    return () => {
      port.disconnect()
      portRef.current = null
    }
  }, [])

  // Start the agent
  const startAgent = useCallback(async (prompt, settings) => {
    if (!portRef.current) {
      setError('No connection to service worker. Try reloading the extension.')
      return
    }

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab) {
      setError('No active tab found.')
      return
    }

    // Clear previous run state
    clearSteps()
    setError(null)
    setRunning(true)
    setPrompt('')

    // Tell the service worker to start
    portRef.current.postMessage({
      type: 'START_AGENT',
      payload: { prompt, settings, tabId: tab.id },
    })
  }, [])

  // Stop the agent
  const stopAgent = useCallback(() => {
    portRef.current?.postMessage({ type: 'STOP_AGENT' })
  }, [])

  return { startAgent, stopAgent }
}
