const ITEMS = [
  { dot: <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--text-lo)', border: '2px solid var(--accent)' }} />, label: 'Robot online' },
  { dot: <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--text-lo)', border: '2px dashed var(--danger)' }} />, label: 'Autonomous (no link)' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--warn)]" />, label: 'Survivor, unconfirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--ok)]" />, label: 'Survivor, confirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />, label: 'Structural hazard' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-[var(--danger)]" />, label: 'Blocked road' },
]

export default function Legend({ showComms }) {
  return (
    <div className="absolute bottom-3 left-3 bg-[var(--ink-950)]/92 backdrop-blur border border-[var(--line)] rounded-lg px-3 py-2.5 text-[11px] text-[var(--text-hi)] shadow-lg">
      <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)] mb-1.5">Map key</p>
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
