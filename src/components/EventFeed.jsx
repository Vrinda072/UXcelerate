import { useState } from 'react'
import { missionClock } from '../sim/engine'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'survivor', label: 'Survivors' },
  { id: 'hazard', label: 'Hazards' },
  { id: 'comm', label: 'Signal' },
]

const SEVERITY_DOT = {
  info: 'bg-[var(--text-lo)]',
  good: 'bg-[var(--ok)]',
  warn: 'bg-[var(--warn)]',
  critical: 'bg-[var(--danger)]',
}

function matchesFilter(evt, filter) {
  if (filter === 'all') return true
  if (filter === 'survivor') return evt.type === 'survivor'
  if (filter === 'hazard') return evt.type === 'hazard' || evt.type === 'blocked' || evt.type === 'route'
  if (filter === 'comm') return evt.type.startsWith('comm')
  return true
}

export default function EventFeed({ state, onAcknowledge, onDispatch, onSetSurvivorStatus, onFocusEvent }) {
  const [filter, setFilter] = useState('all')
  const events = state.events.filter((e) => matchesFilter(e, filter))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-[var(--line)] pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2 py-1 rounded text-[10px] font-semibold tracking-wide ${
              filter === f.id ? 'bg-[var(--ink-700)] text-[var(--text-hi)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
            }`}
          >
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {events.length === 0 && <p className="text-xs text-[var(--text-lo)] px-1 py-4 text-center">No events yet.</p>}
        {events.map((evt) => {
          const survivor = evt.survivorId ? state.survivors.find((s) => s.id === evt.survivorId) : null
          const tickAtEvent = Math.max(0, Math.round((evt.t - state.startedAt) / 1000))
          return (
            <div
              key={evt.id}
              className={`rise-in rounded-md border px-2.5 py-2 text-xs ${
                evt.acknowledged ? 'border-[var(--line)] bg-[var(--ink-950)]' : 'border-[var(--ink-600)] bg-[var(--ink-800)]'
              }`}
            >
              <div
                className={`flex items-start gap-2 ${evt.loc ? 'cursor-pointer' : ''}`}
                onClick={() => evt.loc && onFocusEvent(evt)}
              >
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[evt.severity]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-hi)] leading-snug">{evt.message}</p>
                  <p className="font-mono text-[9.5px] text-[var(--text-lo)] mt-0.5">{missionClock(tickAtEvent)}</p>
                </div>
              </div>

              {survivor && survivor.status === 'unconfirmed' && (
                <div className="flex gap-1.5 mt-2 pl-3.5">
                  <button
                    onClick={() => onDispatch(survivor.id)}
                    className="px-2 py-1 rounded bg-[var(--accent)] hover:brightness-110 text-[var(--ink-950)] text-[10.5px] font-semibold"
                  >
                    Dispatch nearest
                  </button>
                  <button
                    onClick={() => onSetSurvivorStatus(survivor.id, 'confirmed')}
                    className="px-2 py-1 rounded border border-[var(--ok)]/50 text-[var(--ok)] hover:bg-[var(--ok)]/10 text-[10.5px] font-semibold"
                  >
                    Confirm
                  </button>
                </div>
              )}
              {survivor && survivor.status === 'confirmed' && (
                <div className="flex gap-1.5 mt-2 pl-3.5">
                  <button
                    onClick={() => onSetSurvivorStatus(survivor.id, 'rescued')}
                    className="px-2 py-1 rounded border border-[var(--line)] text-[var(--text-hi)] hover:bg-[var(--ink-700)] text-[10.5px] font-semibold"
                  >
                    Mark rescued
                  </button>
                </div>
              )}

              {!evt.acknowledged && !survivor && (
                <div className="mt-1.5 pl-3.5">
                  <button
                    onClick={() => onAcknowledge(evt.id)}
                    className="text-[10.5px] text-[var(--text-lo)] hover:text-[var(--text-hi)] underline underline-offset-2"
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
