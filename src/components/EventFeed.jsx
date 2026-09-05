import { useState } from 'react'
import { timeAgoLabel } from '../sim/engine'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'survivor', label: 'Survivors' },
  { id: 'hazard', label: 'Hazards' },
  { id: 'comm', label: 'Signal' },
]

const SEVERITY_DOT = {
  info: 'bg-slate-500',
  good: 'bg-emerald-400',
  warn: 'bg-amber-400',
  critical: 'bg-red-500',
}

function matchesFilter(evt, filter) {
  if (filter === 'all') return true
  if (filter === 'survivor') return evt.type === 'survivor'
  if (filter === 'hazard') return evt.type === 'hazard' || evt.type === 'blocked' || evt.type === 'route'
  if (filter === 'comm') return evt.type.startsWith('comm')
  return true
}

export default function EventFeed({ state, now, onAcknowledge, onDispatch, onSetSurvivorStatus }) {
  const [filter, setFilter] = useState('all')
  const events = state.events.filter((e) => matchesFilter(e, filter))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-2 pt-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2 py-1 rounded text-[11px] font-medium ${
              filter === f.id ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {events.length === 0 && <p className="text-xs text-slate-600 px-1 py-4 text-center">No events yet.</p>}
        {events.map((evt) => {
          const survivor = evt.survivorId ? state.survivors.find((s) => s.id === evt.survivorId) : null
          return (
            <div
              key={evt.id}
              className={`rounded-md border px-2.5 py-2 text-xs ${
                evt.acknowledged ? 'border-slate-800 bg-[#0d131b]' : 'border-slate-700 bg-[#141b25]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[evt.severity]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 leading-snug">{evt.message}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{timeAgoLabel(now - evt.t)}</p>
                </div>
              </div>

              {survivor && survivor.status === 'unconfirmed' && (
                <div className="flex gap-1.5 mt-2 pl-3.5">
                  <button
                    onClick={() => onDispatch(survivor.id)}
                    className="px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-900 text-[11px] font-semibold"
                  >
                    Dispatch nearest
                  </button>
                  <button
                    onClick={() => onSetSurvivorStatus(survivor.id, 'confirmed')}
                    className="px-2 py-1 rounded border border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-medium"
                  >
                    Confirm
                  </button>
                </div>
              )}
              {survivor && survivor.status === 'confirmed' && (
                <div className="flex gap-1.5 mt-2 pl-3.5">
                  <button
                    onClick={() => onSetSurvivorStatus(survivor.id, 'rescued')}
                    className="px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700/40 text-[11px] font-medium"
                  >
                    Mark rescued
                  </button>
                </div>
              )}

              {!evt.acknowledged && !survivor && (
                <div className="mt-1.5 pl-3.5">
                  <button onClick={() => onAcknowledge(evt.id)} className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2">
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
