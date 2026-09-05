const ITEMS = [
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-slate-500 ring-2 ring-sky-400" />, label: 'Robot (online)' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-slate-500 ring-2 ring-red-400" style={{ borderStyle: 'dashed' }} />, label: 'Robot (signal lost)' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />, label: 'Survivor, unconfirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-emerald-400" />, label: 'Survivor, confirmed' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />, label: 'Structural hazard' },
  { dot: <span className="inline-block w-3 h-3 rounded-full bg-red-500" />, label: 'Blocked road' },
]

export default function Legend() {
  return (
    <div className="absolute bottom-3 left-3 bg-[#0d131bea] backdrop-blur border border-slate-700/60 rounded-lg px-3 py-2.5 text-[11px] text-slate-200 shadow-lg">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Map key</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
            {item.dot}
            {item.label}
          </div>
        ))}
      </div>
      <p className="mt-2 pt-1.5 border-t border-slate-700/50 text-slate-500">Dark areas haven't been checked yet.</p>
    </div>
  )
}
