import { captureScreenshot } from '../services/screenshotService.js'
import { callOpenRouter, RateLimitError } from '../services/openrouterApi.js'

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
