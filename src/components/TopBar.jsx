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
  const m = Math.floor(ticks / 60)
  const s = ticks % 60
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
    <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-slate-800 bg-[#0d131b] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wide text-slate-100 truncate">Rescue Coordination</h1>
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-teal-300 bg-teal-400/10 border border-teal-400/30 rounded px-1.5 py-0.5">
              Simulated exercise
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Earthquake response fleet · elapsed {formatElapsed(state.tick)}</p>
        </div>
      </div>

      <div className="flex items-stretch bg-[#0a0e14] border border-slate-800 rounded-md overflow-hidden shrink-0">
        <StatChip label="Robots online" value={`${active}/${state.robots.length}`} tone={lost ? 'critical' : degraded ? 'warn' : 'good'} />
        <StatChip label="Survivors confirmed" value={`${survivorsConfirmed}/${survivorsFound}`} tone={survivorsFound ? 'warn' : 'default'} />
        <StatChip label="Area checked" value={`${coverage}%`} />
        <StatChip label="Signal strength" value={`${commPct}%`} tone={commTone} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex bg-[#0a0e14] border border-slate-800 rounded-md overflow-hidden">
          {[1, 2, 4].map((v) => (
            <button
              key={v}
              onClick={() => actions.setSpeed(v)}
              className={`px-2.5 py-1.5 text-xs font-medium ${
                state.speed === v ? 'bg-teal-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
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
