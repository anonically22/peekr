# Peekr

Zero-cost AI browser automation assistant powered by free vision models. Describe a task in plain language and Peekr will see your screen and do it — clicking, typing, scrolling, and filling out forms automatically.

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome or Chromium-based browser

### Install & Build
```bash
git clone <repo-url>
cd peekr
npm install
npm run generate-icons
npm run build
```

### Load the Extension
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder
4. Click the Peekr icon in your toolbar to open the side panel

### Configure
Open Settings (gear icon) in the side panel and:
- Enter your API keys (e.g., OpenRouter)
- Choose your preferred vision model
- Configure rate limits and inference preferences

## Usage
1. Navigate to any website
2. Type a prompt like "Add a new task to my todo list"
3. Hit **Go** — the agent takes a screenshot, plans its actions, and executes them
4. Each step shows the agent's reasoning and a screenshot of what it sees
5. Click **Stop** to cancel at any time

*(Note: Currently up to Phase 5 - the UI, screenshot capture mechanics, OpenRouter API integration, and Chrome Debugger Protocol (CDP) Action Execution are complete. Full agent logic will be added in Phase 6).*

## Development
```bash
npm run dev    # watch mode — rebuilds UI on file changes
npm run build  # production build
```
*After modifying background scripts, go to `chrome://extensions` and click the refresh icon on Peekr to reload the service worker.*

## Architecture

```text
User prompt → Screenshot (1280x800) → AI Vision Model → Parse actions
                                                           ↓
                               Execute via Chrome Debugger API
                                                           ↓
                                     New screenshot → Loop until done
```

- **Side panel (React + Zustand)** — Chat UI with reasoning chain and fluid animations (Framer Motion).
- **Service worker** — Orchestrates the agent loop and message passing.
- **Screenshot service** — Captures and scales screenshots strictly to `1280x800` via `OffscreenCanvas`.
- **Chrome Debugger API** — Executes clicks, keystrokes, scrolling, and navigation via CDP.

## Project Structure

```text
src/
├── background/
│   └── service-worker.js         # Message handling & agent orchestration
├── services/
│   └── screenshotService.js      # Capture + scale screenshots via OffscreenCanvas
├── sidepanel/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Main app shell
│   ├── store/
│   │   └── agentStore.js         # Zustand state management
│   ├── hooks/
│   │   └── useSettings.js        # Settings persistence hook
│   └── components/
│       ├── Header.jsx            # Top navigation
│       ├── PromptInput.jsx       # User input & action triggers
│       ├── ReasoningChain.jsx    # Feed of agent thoughts & actions
│       ├── StepCard.jsx          # Individual step display with screenshot
│       └── SettingsPanel.jsx     # Slide-out configuration panel
└── index.css                     # Tailwind CSS entry
```
