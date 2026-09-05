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

const SEVERITY_RING = {
  info: 'ring-[var(--text-lo)]/30',
  good: 'ring-[var(--ok)]/30',
  warn: 'ring-[var(--warn)]/30',
  critical: 'ring-[var(--danger)]/30',
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
      <div className="flex items-center gap-1 px-3 pt-2.5 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide transition-colors ${
              filter === f.id ? 'bg-[var(--ink-700)] text-[var(--text-hi)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
            }`}
          >
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {events.length === 0 && <p className="text-xs text-[var(--text-lo)] px-1 py-4 text-center">No events yet.</p>}
        {events.map((evt, i) => {
          const survivor = evt.survivorId ? state.survivors.find((s) => s.id === evt.survivorId) : null
          const tickAtEvent = Math.max(0, Math.round((evt.t - state.startedAt) / 1000))
          const isLast = i === events.length - 1
          return (
            <div key={evt.id} className="rise-in relative flex gap-2.5 pb-3">
              <div className="flex flex-col items-center shrink-0 pt-1">
                <span className={`w-2 h-2 rounded-full ring-4 ${SEVERITY_DOT[evt.severity]} ${SEVERITY_RING[evt.severity]}`} />
                {!isLast && <span className="w-px flex-1 bg-[var(--line)] mt-1" />}
              </div>
              <div className={`flex-1 min-w-0 pb-0.5 ${evt.acknowledged ? 'opacity-60' : ''}`}>
                <div
                  className={`text-xs ${evt.loc ? 'cursor-pointer hover:text-[var(--accent)]' : ''} transition-colors`}
                  onClick={() => evt.loc && onFocusEvent(evt)}
                >
                  <p className="text-[var(--text-hi)] leading-snug">{evt.message}</p>
                  <p className="font-mono text-[9.5px] text-[var(--text-lo)] mt-0.5">{missionClock(tickAtEvent)}</p>
                </div>

                {survivor && survivor.status === 'unconfirmed' && (
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => onDispatch(survivor.id)}
                      className="px-2 py-1 rounded-md bg-[var(--accent)] hover:brightness-110 text-[var(--ink-950)] text-[10.5px] font-semibold transition-all"
                    >
                      Dispatch nearest
                    </button>
                    <button
                      onClick={() => onSetSurvivorStatus(survivor.id, 'confirmed')}
                      className="px-2 py-1 rounded-md border border-[var(--ok)]/50 text-[var(--ok)] hover:bg-[var(--ok)]/10 text-[10.5px] font-semibold transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
                {survivor && survivor.status === 'confirmed' && (
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => onSetSurvivorStatus(survivor.id, 'rescued')}
                      className="px-2 py-1 rounded-md border border-[var(--line)] text-[var(--text-hi)] hover:bg-[var(--ink-700)] text-[10.5px] font-semibold transition-colors"
                    >
                      Mark rescued
                    </button>
                  </div>
                )}

                {!evt.acknowledged && !survivor && (
                  <button
                    onClick={() => onAcknowledge(evt.id)}
                    className="mt-1 text-[10.5px] text-[var(--text-lo)] hover:text-[var(--text-hi)] underline underline-offset-2"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
