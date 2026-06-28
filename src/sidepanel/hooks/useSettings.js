import { useState, useEffect } from 'react'

const DEFAULTS = {
  openrouterKey: '',
  model: 'openrouter/free',
  profile: 'Name: \nEmail: \nPhone: \nJob title: \nCompany: \nWebsite: ',
  stepDelay: 3000,
  maxSteps: 15,
}

export function useSettings() {
  const [settings, setSettingsState] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(Object.keys(DEFAULTS), (stored) => {
      // Force model to gemma 4 26b a4b
      const updatedSettings = { ...DEFAULTS, ...stored, model: 'google/gemma-4-26b-a4b-it:free' }
      setSettingsState(updatedSettings)
      chrome.storage.local.set(updatedSettings) // ensure storage is updated
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
