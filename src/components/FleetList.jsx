import { timeAgoLabel } from '../sim/engine'

const STATUS_LABEL = {
  active: 'Online',
  degraded: 'Weak signal',
  lost: 'No contact',
}

const STATUS_DOT = {
  active: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  lost: 'bg-red-500',
}

export default function FleetList({ state, selectedRobotId, onSelectRobot }) {
  const now = state.startedAt + state.tick * 1000

  return (
    <aside className="w-72 shrink-0 border-r border-slate-800 bg-[#0d131b] flex flex-col">
      <div className="px-3 py-2 border-b border-slate-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fleet ({state.robots.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.robots.map((r) => {
          const selected = r.id === selectedRobotId
          const lastContactMs = r.status === 'lost' ? now - r.lastContact : 0
          return (
            <button
              key={r.id}
              onClick={() => onSelectRobot(r.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-800/60 flex items-start gap-2.5 transition-colors ${
                selected ? 'bg-sky-500/10 border-l-2 border-l-sky-400' : 'hover:bg-slate-800/40 border-l-2 border-l-transparent'
              }`}
            >
              <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-100 truncate">{r.name}</span>
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status]}`} title={STATUS_LABEL[r.status]} />
                </span>
                <span className="block text-[11px] text-slate-500 truncate">{r.task}</span>
                <span className="flex items-center gap-2 mt-1">
                  <span className="flex-1 h-1 rounded bg-slate-800 overflow-hidden">
                    <span
                      className={`block h-full ${r.battery < 20 ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${r.battery}%` }}
                    />
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{Math.round(r.battery)}%</span>
                </span>
                {r.status === 'lost' && (
                  <span className="block text-[10px] text-red-400 mt-1">Last seen {timeAgoLabel(lastContactMs)}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
