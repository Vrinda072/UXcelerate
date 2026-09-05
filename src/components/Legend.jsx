import { useState } from 'react'

const ITEMS = [
  { dot: <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--text-lo)', border: '2px solid var(--accent)' }} />, label: 'Robot online' },
  { dot: <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--text-lo)', border: '2px dashed var(--danger)' }} />, label: 'Autonomous (no link)' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--warn)]" />, label: 'Survivor, unconfirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--ok)]" />, label: 'Survivor, confirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />, label: 'Structural hazard' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--danger)]" />, label: 'Blocked road' },
]

export default function Legend({ showComms }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--ink-950)]/90 backdrop-blur border border-[var(--line)] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:border-[var(--accent)]/40 shadow-lg shadow-black/40 transition-colors"
        title="Show map key"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 3 6.5v6C3 17 7 21 12 22c5-1 9-5 9-9.5v-6L12 2Z" strokeLinejoin="round" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fade-in absolute bottom-3 left-3 bg-[var(--ink-950)]/95 backdrop-blur border border-[var(--line)] rounded-lg px-3 py-2.5 text-[11px] text-[var(--text-hi)] shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)]">Map key</p>
        <button onClick={() => setOpen(false)} className="text-[var(--text-lo)] hover:text-[var(--text-hi)] leading-none text-sm">
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
            {item.dot}
            {item.label}
          </div>
        ))}
      </div>
      <p className="mt-2 pt-1.5 border-t border-[var(--line)] text-[var(--text-lo)] max-w-[220px]">
        Dim areas are unconfirmed or unchecked. {showComms && 'Red haze marks known dead zones.'}
      </p>
    </div>
  )
}
