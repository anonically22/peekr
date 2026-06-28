export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
        <span className="text-lg">👁</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-text font-mono text-sm font-medium">
          ready to peekr
        </span>
        <span className="text-muted font-mono text-xs leading-relaxed">
          type a task below and hit go.<br />
          peekr will see your screen and do it.
        </span>
      </div>

      <div className="flex flex-col gap-1.5 w-full mt-2">
        <span className="text-muted font-mono text-[10px] uppercase tracking-widest mb-1">
          try saying
        </span>
        {[
          '"search for the best pizza near me"',
          '"fill out the contact form with my info"',
          '"scroll down and click the pricing link"',
          '"go to github.com and star this repo"',
        ].map((example) => (
          <div
            key={example}
            className="px-3 py-2 bg-surface border border-white/5 rounded text-muted font-mono text-[10px] text-left"
          >
            {example}
          </div>
        ))}
      </div>
    </div>
  )
}
