export default function CriticalAlerts({ state, onAcknowledge, onDispatch }) {
  const alerts = state.events.filter((e) => e.severity === 'critical' && !e.acknowledged).slice(0, 3)

  if (alerts.length === 0) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-10 w-[420px] max-w-[90%]">
      {alerts.map((evt) => {
        const survivor = evt.survivorId ? state.survivors.find((s) => s.id === evt.survivorId) : null
        return (
          <div
            key={evt.id}
            className="toast-in flex items-start gap-2.5 bg-[#1a1210] border border-red-500/40 shadow-lg shadow-black/40 rounded-lg px-3 py-2.5"
          >
            <span className="mt-0.5 text-red-400 text-sm">●</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-100 font-medium leading-snug">{evt.message}</p>
              <div className="flex gap-1.5 mt-1.5">
                {survivor && (
                  <button
                    onClick={() => {
                      onDispatch(survivor.id)
                      onAcknowledge(evt.id)
                    }}
                    className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
                  >
                    Dispatch nearest
                  </button>
                )}
                <button
                  onClick={() => onAcknowledge(evt.id)}
                  className="px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700/40 text-[11px] font-medium"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
