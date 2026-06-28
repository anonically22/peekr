import { attachDebugger, detachDebugger, sendCommand } from './debuggerService.js'

/**
 * Executes a list of actions on the given tab using CDP.
 * Attaches the debugger before executing and detaches after (or on error).
 *
 * @param {number} tabId - Chrome tab ID to execute actions on
 * @param {Array} actions - Array of action objects from the AI response
 * @returns {Promise<void>}
 */
export async function executeActions(tabId, actions) {
  await attachDebugger(tabId)

  try {
    for (const action of actions) {
      await executeAction(tabId, action)
    }
  } finally {
    // Always detach after executing, even if an action throws
    await detachDebugger()
  }
}

/**
 * Executes a single action object.
 * Routes to the correct CDP implementation based on action.type.
 *
 * @param {number} tabId
 * @param {object} action
 */
async function executeAction(tabId, action) {
  console.log(`[Peekr] Executing action: ${action.type}`, action)

  switch (action.type) {
    case 'click':
      await executeClick(tabId, action)
      break

    case 'type':
      await executeType(action)
      break

    case 'scroll':
      await executeScroll(action)
      break

    case 'navigate':
      await executeNavigate(tabId, action)
      break

    case 'select':
      await executeSelect(action)
      break

    case 'wait':
      await executeWait(action)
      break

    case 'done':
      // Signal to stop — nothing to execute
      break

    case 'error':
      throw new Error(`Agent error: ${action.message || 'Task could not be completed'}`)

    default:
      console.warn(`[Peekr] Unknown action type: ${action.type} — skipping`)
  }
}

// ─── Action Implementations ────────────────────────────────────────────────

/**
 * CLICK — resolves a CSS selector to page coordinates, then dispatches mouse events.
 *
 * We use Runtime.evaluate to find the element's bounding rect in the page,
 * then dispatch mousemove + mousedown + mouseup at those coordinates.
 * This is more reliable than DOM.querySelector + CDP click because it works
 * on shadow DOM and custom elements too.
 */
async function executeClick(tabId, action) {
  if (!action.selector) {
    throw new Error(`click action missing selector`)
  }

  // Get element coordinates via JS evaluation in the page context
  const result = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        const el = document.querySelector(${JSON.stringify(action.selector)});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
          found: true
        };
      })()
    `,
    returnByValue: true,
  })

  const coords = result?.result?.value
  if (!coords || !coords.found) {
    throw new Error(`Element not found for selector: ${action.selector}`)
  }

  const { x, y } = coords

  // Move mouse to element
  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x,
    y,
    button: 'none',
    clickCount: 0,
  })

  // Short pause between move and click — improves reliability on some sites
  await sleep(50)

  // Mouse down
  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  })

  await sleep(50)

  // Mouse up — this triggers the click event
  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  })

  // Wait for any click-triggered transitions or network requests
  await sleep(200)
}

/**
 * TYPE — inserts text into whatever element currently has focus.
 *
 * Uses Input.insertText which inserts the full string at once
 * rather than dispatching individual key events. This is faster
 * and works correctly with React-controlled inputs.
 *
 * Note: The element must already be focused (via a prior click action).
 */
async function executeType(action) {
  if (!action.text) {
    throw new Error('type action missing text field')
  }

  await sendCommand('Input.insertText', {
    text: action.text,
  })

  // Small pause after typing
  await sleep(100)
}

/**
 * SCROLL — scrolls the page up or down by the given pixel amount.
 *
 * Dispatches a mouseWheel event at the center of the viewport.
 * direction: 'down' = positive deltaY, 'up' = negative deltaY.
 */
async function executeScroll(action) {
  const direction = action.direction || 'down'
  const amount = action.amount || 300

  // Get viewport dimensions for centering the scroll event
  const viewportResult = await sendCommand('Runtime.evaluate', {
    expression: `({ width: window.innerWidth, height: window.innerHeight })`,
    returnByValue: true,
  })

  const viewport = viewportResult?.result?.value || { width: 1280, height: 800 }

  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: Math.round(viewport.width / 2),
    y: Math.round(viewport.height / 2),
    deltaX: 0,
    deltaY: direction === 'down' ? amount : -amount,
  })

  await sleep(300)
}

/**
 * NAVIGATE — navigates the tab to a new URL.
 *
 * Uses chrome.tabs.update rather than CDP Page.navigate.
 * This is simpler and handles redirects + extensions correctly.
 * We wait for the tab to finish loading before returning.
 *
 * @param {number} tabId
 */
async function executeNavigate(tabId, action) {
  if (!action.url) {
    throw new Error('navigate action missing url field')
  }

  // Validate URL format
  let url = action.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // Detach debugger before navigating — navigation invalidates the debugger session
  await detachDebugger()

  // Navigate the tab
  await chrome.tabs.update(tabId, { url })

  // Wait for the tab to finish loading
  await waitForTabLoad(tabId)

  // Re-attach debugger for subsequent actions
  await attachDebugger(tabId)
}

/**
 * SELECT — selects an option in a <select> dropdown element.
 *
 * Uses Runtime.evaluate to set the value and dispatch a change event.
 * This works with both native selects and some custom select libraries.
 */
async function executeSelect(action) {
  if (!action.selector || !action.value) {
    throw new Error('select action missing selector or value field')
  }

  const result = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        const el = document.querySelector(${JSON.stringify(action.selector)});
        if (!el) return { success: false, error: 'Element not found' };
        el.value = ${JSON.stringify(action.value)};
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return { success: true };
      })()
    `,
    returnByValue: true,
  })

  const res = result?.result?.value
  if (!res?.success) {
    throw new Error(`select failed: ${res?.error || 'unknown error'}`)
  }

  await sleep(200)
}

/**
 * WAIT — pauses execution for a given number of milliseconds.
 * Useful when waiting for animations, network responses, or lazy-loaded content.
 * Capped at 10 seconds to prevent runaway waits.
 */
async function executeWait(action) {
  const ms = Math.min(action.ms || 1000, 10000)
  await sleep(ms)
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Waits for the given tab to finish loading.
 * Polls tab status every 200ms, times out after 15 seconds.
 *
 * @param {number} tabId
 */
async function waitForTabLoad(tabId, timeout = 15000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const tab = await chrome.tabs.get(tabId).catch(() => null)

    if (!tab) throw new Error('Tab was closed during navigation')
    if (tab.status === 'complete') return

    await sleep(200)
  }

  throw new Error('Tab took too long to load after navigation')
}

/**
 * Simple sleep utility.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
