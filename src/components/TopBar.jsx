import { mapCoverage } from '../sim/engine'

function StatChip({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'text-slate-200',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    critical: 'text-red-400',
  }
  return (
    <div className="flex flex-col px-3 py-1.5 border-r border-slate-800 last:border-r-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${toneClasses[tone]}`}>{value}</span>
    </div>
  )
}

function formatElapsed(ticks) {
  const totalSec = ticks
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TopBar({ state, actions }) {
  const active = state.robots.filter((r) => r.status === 'active').length
  const degraded = state.robots.filter((r) => r.status === 'degraded').length
  const lost = state.robots.filter((r) => r.status === 'lost').length
  const survivorsFound = state.survivors.length
  const survivorsConfirmed = state.survivors.filter((s) => s.status === 'confirmed' || s.status === 'rescued').length
  const coverage = Math.round(mapCoverage(state) * 100)
  const commPct = Math.round(state.commQuality * 100)
  const commTone = commPct > 70 ? 'good' : commPct > 45 ? 'warn' : 'critical'

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0d131b] shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <div>
          <h1 className="text-sm font-bold tracking-wide text-slate-100">RESCUE OPS · SECTOR 7 COORDINATION</h1>
          <p className="text-[11px] text-slate-500">Post-earthquake response · mission clock {formatElapsed(state.tick)}</p>
        </div>
      </div>

      <div className="flex items-stretch bg-[#0a0e14] border border-slate-800 rounded-md overflow-hidden">
        <StatChip label="Robots" value={`${active}/${state.robots.length}`} tone={lost ? 'critical' : degraded ? 'warn' : 'good'} />
        <StatChip label="Survivors" value={`${survivorsConfirmed}/${survivorsFound}`} tone={survivorsFound ? 'warn' : 'default'} />
        <StatChip label="Map covered" value={`${coverage}%`} />
        <StatChip label="Link quality" value={`${commPct}%`} tone={commTone} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-[#0a0e14] border border-slate-800 rounded-md overflow-hidden">
          {[1, 2, 4].map((v) => (
            <button
              key={v}
              onClick={() => actions.setSpeed(v)}
              className={`px-2.5 py-1.5 text-xs font-medium ${
                state.speed === v ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {v}×
            </button>
          ))}
        </div>
        <button
          onClick={actions.togglePause}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-700 bg-[#141b25] text-slate-200 hover:bg-[#1c2530]"
        >
          {state.paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>
    </header>
  )
}
