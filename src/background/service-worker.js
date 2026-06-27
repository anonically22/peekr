import { captureScreenshot } from '../services/screenshotService.js'

// Open side panel when toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAKE_SCREENSHOT') {
    handleScreenshot(sendResponse)
    // Return true to keep the message channel open for async response
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
