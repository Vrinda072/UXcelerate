import { mapConfidence, missionClock } from '../sim/engine'

function ConfidenceRing({ value }) {
  const r = 20
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--ink-700)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[11px] font-bold text-[var(--accent)]">{value}</span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'hi' }) {
  const toneClass = {
    hi: 'text-[var(--text-hi)]',
    ok: 'text-[var(--ok)]',
    warn: 'text-[var(--warn)]',
    danger: 'text-[var(--danger)]',
  }[tone]
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)]">{label}</span>
      <span className={`font-mono text-[13px] font-semibold ${toneClass}`}>{value}</span>
    </div>
  )
}

export default function TopBar({ state, mode, actions, showComms, onToggleComms }) {
  const online = state.robots.filter((r) => r.link === 'online').length
  const autonomous = state.robots.filter((r) => r.link === 'autonomous').length
  const survivorsFound = state.survivors.length
  const survivorsConfirmed = state.survivors.filter((s) => s.status === 'confirmed' || s.status === 'rescued').length
  const confidence = Math.round(mapConfidence(state) * 100)
  const commPct = Math.round(state.commQuality * 100)
  const commTone = commPct > 70 ? 'ok' : commPct > 45 ? 'warn' : 'danger'
  const started = state.phase === 'running'

  return (
    <header className="relative flex items-center justify-between gap-4 px-5 h-16 border-b border-[var(--line)] bg-[var(--ink-950)] shrink-0">
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        <span className={`w-2 h-2 rounded-full ${started ? 'bg-[var(--danger)] animate-pulse' : 'bg-[var(--text-lo)]'}`} />
        <div className="min-w-0 leading-tight">
          <h1 className="text-[13px] font-semibold tracking-wide text-[var(--text-hi)] truncate">RESCUE COORDINATION</h1>
          <p className="font-mono text-[10px] text-[var(--text-lo)] truncate">
            {started ? (
              <>
                T+{missionClock(state.tick)}
                {state.quakeMagnitude && <> · M{state.quakeMagnitude}</>}
              </>
            ) : (
              'STANDBY'
            )}
          </p>
        </div>
      </div>

      {started && (
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center min-w-0">
          <div className="flex items-center gap-2.5">
            <ConfidenceRing value={confidence} />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)] mb-1">Map confidence</span>
              <span className="font-mono text-lg font-bold text-[var(--text-hi)]">{confidence}%</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Stat label="Robots online" value={`${online}/${state.robots.length}`} tone={autonomous ? 'warn' : 'ok'} />
            <Stat label="Survivors" value={`${survivorsConfirmed}/${survivorsFound}`} tone={survivorsFound ? 'warn' : 'hi'} />
            <Stat label="Signal" value={`${commPct}%`} tone={commTone} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {started && (
          <>
            <div className="flex bg-[var(--ink-800)] border border-[var(--line)] rounded-md overflow-hidden">
              <button
                onClick={actions.exitReplay}
                className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition-colors ${
                  mode === 'live' ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={actions.enterReplay}
                className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition-colors ${
                  mode === 'replay' ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                }`}
              >
                REPLAY
              </button>
            </div>

            <button
              onClick={onToggleComms}
              className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide rounded-md border transition-colors ${
                showComms
                  ? 'border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]'
                  : 'border-[var(--line)] bg-[var(--ink-800)] text-[var(--text-lo)] hover:text-[var(--text-hi)]'
              }`}
              title="Toggle communication coverage overlay"
            >
              SIGNAL MAP
            </button>

            {mode === 'live' && (
              <>
                <div className="flex bg-[var(--ink-800)] border border-[var(--line)] rounded-md overflow-hidden">
                  {[1, 2, 4].map((v) => (
                    <button
                      key={v}
                      onClick={() => actions.setSpeed(v)}
                      className={`px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                        state.speed === v ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                      }`}
                    >
                      {v}×
                    </button>
                  ))}
                </div>
                <button
                  onClick={actions.togglePause}
                  className="px-3 py-1.5 text-[10px] font-semibold tracking-wide rounded-md border border-[var(--line)] bg-[var(--ink-800)] text-[var(--text-hi)] hover:bg-[var(--ink-700)] transition-colors"
                >
                  {state.paused ? 'RESUME' : 'PAUSE'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </header>
  )
}
