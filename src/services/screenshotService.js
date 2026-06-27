const TARGET_WIDTH = 1280
const TARGET_HEIGHT = 800

/**
 * Captures the visible area of the active tab in the current window.
 * Scales the result to TARGET_WIDTH x TARGET_HEIGHT using OffscreenCanvas.
 * Returns a base64 PNG data URL string.
 *
 * Must be called from the service worker context only.
 * chrome.tabs.captureVisibleTab is not available in side panel or content scripts.
 */
export async function captureScreenshot() {
  // Step 1: Get the active tab in the last focused window
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })

  if (!tab) {
    throw new Error('No active tab found')
  }

  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    throw new Error('Cannot capture Chrome internal pages. Navigate to a regular website first.')
  }

  // Step 2: Capture the visible area as a PNG data URL
  // This returns something like: "data:image/png;base64,iVBORw0KGgo..."
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
    quality: 100,
  })

  // Step 3: Scale to TARGET_WIDTH x TARGET_HEIGHT using OffscreenCanvas
  // OffscreenCanvas is available in service workers (unlike regular Canvas)
  const scaled = await scaleImage(dataUrl, TARGET_WIDTH, TARGET_HEIGHT)

  return scaled
}

/**
 * Scales a base64 image data URL to the given width and height.
 * Uses OffscreenCanvas which is available in service worker context.
 *
 * @param {string} dataUrl - The original base64 PNG data URL
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<string>} - Scaled base64 PNG data URL
 */
async function scaleImage(dataUrl, width, height) {
  // Fetch the data URL as a blob
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  // Create an ImageBitmap from the blob
  // ImageBitmap is supported in service workers
  const bitmap = await createImageBitmap(blob)

  // Create an OffscreenCanvas at the target dimensions
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Draw the image scaled to fit the canvas
  // This stretches to exact dimensions — the AI doesn't need aspect ratio preserved
  ctx.drawImage(bitmap, 0, 0, width, height)

  // Convert canvas to blob then to base64 data URL
  const scaledBlob = await canvas.convertToBlob({ type: 'image/png' })
  const scaledDataUrl = await blobToDataUrl(scaledBlob)

  return scaledDataUrl
}

/**
 * Converts a Blob to a base64 data URL string.
 * Uses FileReader which works in service worker context.
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
    reader.readAsDataURL(blob)
  })
}
