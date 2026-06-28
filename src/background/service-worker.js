import { captureScreenshot } from '../services/screenshotService.js'
import { callOpenRouter, RateLimitError } from '../services/openrouterApi.js'
import { executeActions } from '../services/actionExecutor.js'
import { detachDebugger } from '../services/debuggerService.js'

// Open side panel when toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAKE_SCREENSHOT') {
    handleScreenshot(sendResponse)
    return true
  }

  if (message.type === 'TEST_API_CALL') {
    handleTestApiCall(message.payload, sendResponse)
    return true
  }

  if (message.type === 'TEST_ACTIONS') {
    handleTestActions(message.payload, sendResponse)
    return true
  }
})

async function handleScreenshot(sendResponse) {
  try {
    const dataUrl = await captureScreenshot()
    sendResponse({ success: true, dataUrl })
  } catch (error) {
    console.error('[Peekr] Screenshot failed:', error)
    sendResponse({ success: false, error: error.message })
  }
}

// Phase 4 test handler
async function handleTestApiCall({ prompt, settings }, sendResponse) {
  try {
    // Take a screenshot first
    const screenshotUrl = await captureScreenshot()

    // Call OpenRouter
    const result = await callOpenRouter({
      apiKey: settings.openrouterKey,
      model: settings.model,
      screenshotUrl,
      userPrompt: prompt,
      profile: settings.profile,
      history: [],
    })

    sendResponse({ success: true, screenshotUrl, result })
  } catch (error) {
    console.error('[Peekr] API test failed:', error)

    const isRateLimit = error?.name === 'RateLimitError'
    sendResponse({
      success: false,
      error: error?.message || String(error),
      isRateLimit,
    })
  }
}

// Phase 5 test handler
async function handleTestActions({ tabId, actions }, sendResponse) {
  try {
    await executeActions(tabId, actions)
    sendResponse({ success: true })
  } catch (error) {
    console.error('[Peekr] Action execution failed:', error)
    // Always detach on error
    await detachDebugger()
    sendResponse({ success: false, error: error.message })
  }
}
