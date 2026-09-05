import { mapConfidence, missionClock } from '../sim/engine'

function Stat({ label, value, tone = 'hi' }) {
  const toneClass = {
    hi: 'text-[var(--text-hi)]',
    ok: 'text-[var(--ok)]',
    warn: 'text-[var(--warn)]',
    danger: 'text-[var(--danger)]',
  }[tone]
  return (
    <div className="flex flex-col gap-0.5 px-3.5">
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
    <header className="relative flex items-center justify-between gap-3 px-4 h-14 border-b border-[var(--line)] bg-[var(--ink-950)] shrink-0">
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
        <div className="hidden md:flex items-center flex-1 justify-center min-w-0">
          <div className="flex items-center gap-1.5 pr-4 mr-4 border-r border-[var(--line)]">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)] mb-1">Map confidence</span>
              <span className="font-mono text-2xl font-bold text-[var(--accent)] tabular-mono">{confidence}%</span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-[var(--ink-700)] overflow-hidden ml-2">
              <div className="h-full bg-[var(--accent)] transition-all duration-700" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className="flex items-stretch divide-x divide-[var(--line)]">
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
                className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide ${
                  mode === 'live' ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={actions.enterReplay}
                className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide ${
                  mode === 'replay' ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                }`}
              >
                REPLAY
              </button>
            </div>

            <button
              onClick={onToggleComms}
              className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-wide rounded-md border ${
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
                      className={`px-2.5 py-1.5 text-[10px] font-semibold ${
                        state.speed === v ? 'bg-[var(--accent)] text-[var(--ink-950)]' : 'text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                      }`}
                    >
                      {v}×
                    </button>
                  ))}
                </div>
                <button
                  onClick={actions.togglePause}
                  className="px-3 py-1.5 text-[10px] font-semibold tracking-wide rounded-md border border-[var(--line)] bg-[var(--ink-800)] text-[var(--text-hi)] hover:bg-[var(--ink-700)]"
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
