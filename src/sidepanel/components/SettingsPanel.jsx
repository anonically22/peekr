import { motion } from 'framer-motion'
import { useSettings } from '../hooks/useSettings'
import useAgentStore from '../store/agentStore'

const MODELS = [
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B' },
]

export default function SettingsPanel() {
  const { settings, saveSettings, loaded } = useSettings()
  const setSettingsOpen = useAgentStore((s) => s.setSettingsOpen)

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted text-xs">loading...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col h-full p-4 gap-6 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-text text-sm font-medium">settings</span>
        <button
          onClick={() => setSettingsOpen(false)}
          className="text-muted hover:text-text transition-colors text-xs"
        >
          ← back
        </button>
      </div>

      {/* API Key */}
      <section className="flex flex-col gap-2">
        <label className="text-muted text-[10px] uppercase tracking-widest">
          OpenRouter API Key
        </label>
        <input
          type="password"
          value={settings.openrouterKey}
          onChange={(e) => saveSettings({ openrouterKey: e.target.value })}
          placeholder="sk-or-..."
          className="
            bg-surface border border-white/10 rounded px-3 py-2
            text-text text-xs outline-none
            focus:border-accent/40 transition-colors
            placeholder-muted
          "
        />
        <span className="text-muted text-[10px]">
          get your free key at openrouter.ai
        </span>
      </section>

      {/* Model */}
      <section className="flex flex-col gap-2">
        <label className="text-muted text-[10px] uppercase tracking-widest">
          Model
        </label>
        <select
          value={settings.model}
          onChange={(e) => saveSettings({ model: e.target.value })}
          className="
            bg-surface border border-white/10 rounded px-3 py-2
            text-text text-xs outline-none
            focus:border-accent/40 transition-colors
            cursor-pointer
          "
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <span className="text-muted text-[10px]">
          auto picks the best free vision model available
        </span>
      </section>

      {/* Profile */}
      <section className="flex flex-col gap-2">
        <label className="text-muted text-[10px] uppercase tracking-widest">
          Profile (for form filling)
        </label>
        <textarea
          value={settings.profile}
          onChange={(e) => saveSettings({ profile: e.target.value })}
          placeholder={"name: Anirbaan Sarkar\nemail: hello@example.com\njob title: Full Stack Developer"}
          rows={4}
          className="
            bg-surface border border-white/10 rounded px-3 py-2
            text-text text-xs outline-none resize-none
            focus:border-accent/40 transition-colors
            placeholder-muted leading-relaxed
          "
        />
        <span className="text-muted text-[10px]">
          injected into the AI prompt so it can fill forms automatically
        </span>
      </section>

      {/* Rate limit controls */}
      <section className="flex flex-col gap-4">
        <span className="text-muted text-[10px] uppercase tracking-widest">
          Rate Limit Protection
        </span>

        {/* Step delay */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-text text-xs">step delay</label>
            <span className="text-accent text-xs">{settings.stepDelay / 1000}s</span>
          </div>
          <input
            type="range"
            min={1000}
            max={10000}
            step={500}
            value={settings.stepDelay}
            onChange={(e) => saveSettings({ stepDelay: Number(e.target.value) })}
            className="w-full accent-accent"
          />
          <span className="text-muted text-[10px]">
            minimum pause between each agent step
          </span>
        </div>

        {/* Max steps */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-text text-xs">max steps</label>
            <span className="text-accent text-xs">{settings.maxSteps}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={settings.maxSteps}
            onChange={(e) => saveSettings({ maxSteps: Number(e.target.value) })}
            className="w-full accent-accent"
          />
          <span className="text-muted text-[10px]">
            agent stops automatically after this many steps
          </span>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <span className="text-muted text-[10px]">
          peekr v0.1.0 — zero cost, zero backend
        </span>
      </div>
    </motion.div>
  )
}
