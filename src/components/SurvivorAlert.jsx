import { nearestUnit } from '../sim/robotState'

const CONDITION_TONE = {
  Critical: 'text-[var(--danger)]',
  Injured: 'text-[var(--warn)]',
  Stable: 'text-[var(--ok)]',
}

export default function SurvivorAlert({ state, onAcknowledge, onDispatch }) {
  const alerts = state.events
    .filter((e) => e.type === 'survivor' && !e.acknowledged)
    .slice(0, 2)
    .map((evt) => ({ evt, survivor: state.survivors.find((s) => s.id === evt.survivorId) }))
    .filter((a) => a.survivor && a.survivor.status === 'unconfirmed')

  if (alerts.length === 0) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-10 w-[300px] max-w-[92%]">
      {alerts.map(({ evt, survivor }) => {
        const unit = nearestUnit(state.robots, survivor)
        return (
          <div
            key={evt.id}
            className="rise-in bg-[var(--ink-950)]/95 backdrop-blur border border-[var(--danger)]/45 shadow-lg shadow-black/50 rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--danger)]/12 border-b border-[var(--danger)]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-[var(--danger)]">SURVIVOR DETECTED</span>
            </div>
            <div className="px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-[var(--text-lo)]">Confidence</span>
              <span className="font-mono text-right text-[var(--text-hi)]">{survivor.confidence}%</span>
              <span className="text-[var(--text-lo)]">Condition</span>
              <span className={`font-mono text-right font-semibold ${CONDITION_TONE[survivor.condition]}`}>{survivor.condition}</span>
              {unit && (
                <>
                  <span className="text-[var(--text-lo)]">Nearest unit</span>
                  <span className="font-mono text-right text-[var(--text-hi)]">{unit.robot.name}</span>
                  <span className="text-[var(--text-lo)]">Distance</span>
                  <span className="font-mono text-right text-[var(--text-hi)]">{unit.distanceMeters}m</span>
                </>
              )}
            </div>
            <div className="flex gap-1.5 px-3 pb-3">
              <button
                onClick={() => {
                  onDispatch(survivor.id)
                  onAcknowledge(evt.id)
                }}
                className="flex-1 px-2 py-1.5 rounded-md bg-[var(--danger)] hover:brightness-110 text-white text-[10.5px] font-bold tracking-wide transition-all"
              >
                DISPATCH {survivor.condition === 'Critical' ? 'MEDICAL UNIT' : 'NEAREST UNIT'}
              </button>
              <button
                onClick={() => onAcknowledge(evt.id)}
                className="px-2.5 py-1.5 rounded-md border border-[var(--line)] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--ink-800)] text-[10.5px] font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
