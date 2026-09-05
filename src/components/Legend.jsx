const ITEMS = [
  { swatch: <span className="inline-block w-3 h-3 rounded-[2px] bg-[#0c1119] border border-slate-700" />, label: 'Unmapped' },
  { swatch: <span className="inline-block w-3 h-3 rounded-[2px] bg-[#1a2430] border border-slate-700" />, label: 'Explored' },
  { swatch: <span className="inline-block w-3 h-3 rounded-[2px] border border-sky-400/60" style={{ borderStyle: 'dashed' }} />, label: 'Map frontier' },
  { swatch: <span className="text-red-400 text-xs">✕</span>, label: 'Blocked path' },
  { swatch: <span className="text-orange-400 text-xs">⚠</span>, label: 'Structural hazard' },
  { swatch: <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />, label: 'Survivor (unconfirmed)' },
  { swatch: <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />, label: 'Survivor (confirmed)' },
  { swatch: <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-red-500" style={{ borderStyle: 'dashed' }} />, label: 'Lost-contact drift radius' },
]

export default function Legend() {
  return (
    <div className="absolute bottom-3 left-3 bg-[#0d131bcc] backdrop-blur border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {ITEMS.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-4 flex items-center justify-center shrink-0">{item.swatch}</span>
          {item.label}
        </div>
      ))}
    </div>
  )
}
