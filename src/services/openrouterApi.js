const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT_TEMPLATE = `You are Peekr, a browser automation agent. You see screenshots of web pages and output actions to complete the user's task.

CRITICAL: You must respond with ONLY a valid JSON object. No markdown. No explanation. No code blocks. No text before or after the JSON. Just the raw JSON object.

RESPONSE SCHEMA:
{
  "reasoning": "one or two sentences explaining what you see and what you will do next",
  "actions": [array of action objects — see below]
}

ACTION TYPES:
{ "type": "click", "selector": "css selector string", "description": "what this clicks" }
{ "type": "type", "text": "text to type into the focused element" }
{ "type": "scroll", "direction": "down" | "up", "amount": number of pixels }
{ "type": "navigate", "url": "full URL including https://" }
{ "type": "select", "selector": "css selector of the <select> element", "value": "option value to select" }
{ "type": "keypress", "key": "Enter" | "Escape" | "Tab" }
{ "type": "wait", "ms": milliseconds to wait }
{ "type": "done" }
{ "type": "error", "message": "description of why you cannot complete the task" }

RULES:
- Always include a "reasoning" field.
- Return 1 to 4 actions per response. Never more than 4.
- If the task is complete, return [{ "type": "done" }] as the only action.
- If you cannot see how to proceed, return [{ "type": "error", "message": "..." }].
- Prefer broad CSS selectors. Avoid specific tag names if possible (e.g. use [name="q"] or [title="Search"] instead of input[name="q"] which might fail if the site uses a textarea).
- Before typing, you usually need a "click" action to focus the field.
- To submit a search or form, you can often use a "keypress" action with "Enter" after typing, rather than trying to click a submit button.
- Never return markdown, code blocks, or any text outside the JSON object.

USER PROFILE (use this for filling forms):
[PROFILE_PLACEHOLDER]`

/**
 * Builds the system prompt, injecting the user's profile.
 *
 * @param {string} profile - Freeform user profile text from settings
 * @returns {string}
 */
function buildSystemPrompt(profile) {
  const profileText = profile?.trim()
    ? profile.trim()
    : 'No profile provided.'
  return SYSTEM_PROMPT_TEMPLATE.replace('[PROFILE_PLACEHOLDER]', profileText)
}

/**
 * Sends a screenshot and conversation history to OpenRouter.
 * Returns the parsed JSON action response from the model.
 *
 * @param {object} params
 * @param {string} params.apiKey         - OpenRouter API key
 * @param {string} params.model          - OpenRouter model ID
 * @param {string} params.screenshotUrl  - base64 PNG data URL of the current screenshot
 * @param {string} params.userPrompt     - the user's original task description
 * @param {string} params.profile        - user profile text for form filling
 * @param {Array}  params.history        - previous messages in this session for context
 *                                         Format: [{ role, content }] (OpenAI message format)
 * @returns {Promise<{ reasoning: string, actions: Array }>}
 */
export async function callOpenRouter({
  apiKey,
  model,
  screenshotUrl,
  userPrompt,
  profile,
  history = [],
}) {
  if (!apiKey) {
    throw new Error('No OpenRouter API key set. Open settings and add your key.')
  }

  const systemPrompt = buildSystemPrompt(profile)

  // Build the user message with screenshot attached
  // OpenRouter accepts images as image_url in the content array (OpenAI vision format)
  const userMessage = {
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          url: screenshotUrl,
          detail: 'high',
        },
      },
      {
        type: 'text',
        text: history.length === 0
          ? `Task: ${userPrompt}\n\nLook at the screenshot and tell me what actions to take to complete this task.`
          : `Continue the task: ${userPrompt}\n\nHere is the current state of the page. What actions should I take next?`,
      },
    ],
  }

  // Full message array: system + conversation history + new user message
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    userMessage,
  ]

  // First attempt
  const rawText = await fetchCompletion({ apiKey, model, messages })

  // Try to parse JSON
  let parsed = tryParseJson(rawText)

  // If parsing failed, retry once with a stricter reminder
  if (!parsed) {
    console.warn('[Peekr] JSON parse failed on first attempt, retrying...')

    const retryMessages = [
      ...messages,
      { role: 'assistant', content: rawText },
      {
        role: 'user',
        content: 'Your response was not valid JSON. Respond with ONLY a raw JSON object matching the schema. No markdown, no code blocks, no explanation. Start your response with { and end with }.',
      },
    ]

    const retryText = await fetchCompletion({ apiKey, model, messages: retryMessages })
    parsed = tryParseJson(retryText)

    if (!parsed) {
      throw new Error(`Model returned invalid JSON after retry.\n\nRaw response:\n${retryText}`)
    }
  }

  // Validate the parsed object has the required shape
  if (!parsed.reasoning || !Array.isArray(parsed.actions)) {
    throw new Error(`Model response missing required fields (reasoning, actions).\n\nParsed: ${JSON.stringify(parsed)}`)
  }

  return parsed
}

/**
 * Makes the actual POST request to OpenRouter.
 * Throws on HTTP errors including 429 rate limiting.
 *
 * @param {object} params
 * @param {string} params.apiKey
 * @param {string} params.model
 * @param {Array}  params.messages
 * @returns {Promise<string>} - raw text content from the model
 */
async function fetchCompletion({ apiKey, model, messages }) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'chrome-extension://peekr',
      'X-Title': 'Peekr',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.1,   // low temperature = more deterministic JSON output
    }),
  })

  // Handle HTTP errors
  if (!response.ok) {
    if (response.status === 429) {
      throw new RateLimitError('OpenRouter rate limit hit. Waiting before retry.')
    }
    if (response.status === 401) {
      throw new Error('Invalid API key. Check your OpenRouter key in settings.')
    }
    if (response.status === 402) {
      throw new Error('OpenRouter account out of credits. Free tier limit may have been reached.')
    }

    const body = await response.text().catch(() => '')
    throw new Error(`OpenRouter API error ${response.status}: ${body}`)
  }

  const data = await response.json()

  // Extract text content from the response
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenRouter API.')
  }

  return content
}

/**
 * Attempts to parse a JSON string from the model response.
 * Handles common model quirks: markdown code fences, leading/trailing text.
 * Returns null if parsing fails rather than throwing.
 *
 * @param {string} text
 * @returns {object|null}
 */
function tryParseJson(text) {
  if (!text) return null

  let cleaned = text.trim()

  // Strip markdown code fences if present
  // Model sometimes wraps JSON in ```json ... ``` despite instructions
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  // Find the first { and last } to extract just the JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) return null

  const jsonStr = cleaned.slice(start, end + 1)

  try {
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

/**
 * Custom error class for rate limit responses.
 * Allows the service worker to handle 429s specifically
 * (pause loop, show countdown) vs other errors.
 */
export class RateLimitError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RateLimitError'
  }
}
