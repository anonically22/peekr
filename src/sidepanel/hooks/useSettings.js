import { useState, useEffect } from 'react'

const DEFAULTS = {
  openrouterKey: '',
  model: 'openrouter/free',
  profile: '',
  stepDelay: 3000,
  maxSteps: 15,
}

export function useSettings() {
  const [settings, setSettingsState] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(Object.keys(DEFAULTS), (stored) => {
      setSettingsState({ ...DEFAULTS, ...stored })
      setLoaded(true)
    })
  }, [])

  const saveSettings = (patch) => {
    const updated = { ...settings, ...patch }
    setSettingsState(updated)
    chrome.storage.local.set(updated)
  }

  return { settings, saveSettings, loaded }
}
