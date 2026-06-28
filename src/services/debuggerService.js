const DEBUGGER_VERSION = '1.3'

// Track currently attached tab so we can detach cleanly
let attachedTabId = null

/**
 * Attaches the Chrome debugger to the given tab.
 * If already attached to a different tab, detaches first.
 * If already attached to the same tab, does nothing.
 *
 * @param {number} tabId
 */
export async function attachDebugger(tabId) {
  if (attachedTabId === tabId) {
    // Already attached to this tab — nothing to do
    return
  }

  if (attachedTabId !== null) {
    // Attached to a different tab — detach first
    await detachDebugger()
  }

  await chrome.debugger.attach({ tabId }, DEBUGGER_VERSION)
  attachedTabId = tabId
  console.log(`[Peekr] Debugger attached to tab ${tabId}`)
}

/**
 * Detaches the Chrome debugger from the currently attached tab.
 * Safe to call even if no debugger is attached.
 */
export async function detachDebugger() {
  if (attachedTabId === null) return

  try {
    await chrome.debugger.detach({ tabId: attachedTabId })
    console.log(`[Peekr] Debugger detached from tab ${attachedTabId}`)
  } catch (error) {
    // Tab may have been closed or navigated away — ignore detach errors
    console.warn('[Peekr] Detach error (tab may be gone):', error.message)
  } finally {
    attachedTabId = null
  }
}

/**
 * Sends a CDP command to the currently attached tab.
 * Throws if no debugger is attached.
 *
 * @param {string} method - CDP method e.g. 'Input.dispatchMouseEvent'
 * @param {object} params - CDP method params
 * @returns {Promise<object>} - CDP response
 */
export async function sendCommand(method, params = {}) {
  if (attachedTabId === null) {
    throw new Error('No debugger attached. Call attachDebugger() first.')
  }

  return chrome.debugger.sendCommand({ tabId: attachedTabId }, method, params)
}

/**
 * Returns the currently attached tab ID, or null if none.
 * Used by the service worker to check attachment state.
 */
export function getAttachedTabId() {
  return attachedTabId
}

// Auto-detach if the tab is closed while we are attached
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === attachedTabId) {
    console.log('[Peekr] Attached tab was closed — clearing state')
    attachedTabId = null
  }
})

// Auto-detach if another debugger client takes over the tab
chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId === attachedTabId) {
    console.log(`[Peekr] Debugger detached externally: ${reason}`)
    attachedTabId = null
  }
})
