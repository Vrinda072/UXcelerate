import { timeAgoLabel } from '../sim/engine'
import { robotStateLabel, TONE_TEXT_CLASS, TONE_DOT_CLASS } from '../sim/robotState'

export default function FleetList({ state, selectedRobotId, onSelectRobot }) {
  const now = state.startedAt + state.tick * 1000

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--line)] bg-[var(--ink-950)] flex flex-col">
      <div className="px-3 h-9 flex items-center border-b border-[var(--line)]">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-lo)]">
          Fleet <span className="font-mono text-[var(--text-hi)]">{state.robots.length}</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.robots.map((r) => {
          const selected = r.id === selectedRobotId
          const { label, tone } = robotStateLabel(r)
          const lastContactMs = r.link === 'autonomous' ? now - r.lastContact : 0
          return (
            <button
              key={r.id}
              onClick={() => onSelectRobot(r.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-[var(--line)]/60 flex items-start gap-2.5 transition-colors ${
                selected ? 'bg-[var(--accent-dim)] border-l-2 border-l-[var(--accent)]' : 'hover:bg-[var(--ink-800)] border-l-2 border-l-transparent'
              }`}
            >
              <span className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[var(--text-hi)] truncate">{r.name}</span>
                  <span className="font-mono text-[9px] text-[var(--text-lo)]">{r.id}</span>
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-medium mt-0.5 ${TONE_TEXT_CLASS[tone]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT_CLASS[tone]}`} />
                  {label}
                </span>
                <span className="flex items-center gap-2 mt-1.5">
                  <span className="flex-1 h-1 rounded-full bg-[var(--ink-700)] overflow-hidden">
                    <span
                      className={`block h-full ${r.battery < 20 ? 'bg-[var(--warn)]' : 'bg-[var(--text-lo)]'}`}
                      style={{ width: `${r.battery}%` }}
                    />
                  </span>
                  <span className="font-mono text-[9px] text-[var(--text-lo)] tabular-mono">{Math.round(r.battery)}%</span>
                </span>
                {r.link === 'autonomous' && (
                  <span className="block text-[9px] text-[var(--danger)] mt-1 font-mono">last fix {timeAgoLabel(lastContactMs)}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
