import { missionClock } from '../sim/engine'

export default function ReplayBar({ history, replayIndex, onScrub, onExit }) {
  const max = Math.max(0, history.length - 1)

  return (
    <div className="absolute left-0 right-0 bottom-0 bg-[var(--ink-950)]/95 backdrop-blur border-t border-[var(--line)] px-4 py-2.5 flex items-center gap-3">
      <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--accent)] shrink-0">REPLAY</span>
      <span className="font-mono text-[11px] text-[var(--text-hi)] shrink-0 w-16">{missionClock(replayIndex)}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(replayIndex, max)}
        onChange={(e) => onScrub(Number(e.target.value))}
        className="flex-1 accent-[var(--accent)]"
      />
      <span className="font-mono text-[11px] text-[var(--text-lo)] shrink-0 w-16 text-right">{missionClock(max)}</span>
      <button
        onClick={onExit}
        className="ml-2 px-3 py-1 rounded-md border border-[var(--line)] bg-[var(--ink-800)] text-[var(--text-hi)] text-[10.5px] font-semibold hover:bg-[var(--ink-700)] shrink-0"
      >
        Go live
      </button>
    </div>
  )
}
