import { timeAgoLabel } from '../sim/engine'
import { robotStateLabel, TONE_TEXT_CLASS, TONE_DOT_CLASS } from '../sim/robotState'

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export default function RobotDetailPanel({ robot, now, mode, started }) {
  if (!robot) {
    return <div className="p-4 text-sm text-[var(--text-lo)] border-b border-[var(--line)]">Select a robot to see its telemetry.</div>
  }

  const { label, tone } = robotStateLabel(robot)
  const sinceContact = now - robot.lastContact
  const missionText =
    robot.activity === 'idle'
      ? 'Standing by at base'
      : robot.assignment === 'survivor'
        ? 'Responding to survivor report'
        : robot.assignment === 'manual'
          ? 'Manual waypoint order'
          : 'Autonomous area search'
  const etaCells = robot.assignment && robot.target ? distance(robot, robot.target) : null

  return (
    <div className="p-3.5 border-b border-[var(--line)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: robot.color }} />
        <h3 className="text-[14px] font-semibold text-[var(--text-hi)]">{robot.name}</h3>
        <span className="font-mono text-[10px] text-[var(--text-lo)] ml-auto">{robot.id}</span>
      </div>

      <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-3 ${TONE_TEXT_CLASS[tone]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT_CLASS[tone]}`} />
        {label.toUpperCase()}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <dt className="text-[var(--text-lo)]">Mission</dt>
        <dd className="text-[var(--text-hi)] text-right truncate" title={missionText}>
          {missionText}
        </dd>
        <dt className="text-[var(--text-lo)]">Battery</dt>
        <dd className={`font-mono text-right ${robot.battery < 20 ? 'text-[var(--warn)]' : 'text-[var(--text-hi)]'}`}>
          {Math.round(robot.battery)}%
        </dd>
        <dt className="text-[var(--text-lo)]">Area scanned</dt>
        <dd className="font-mono text-[var(--text-hi)] text-right">{robot.discoveries} cells</dd>
        {etaCells != null && (
          <>
            <dt className="text-[var(--text-lo)]">Distance to target</dt>
            <dd className="font-mono text-[var(--text-hi)] text-right">~{etaCells * 90}m</dd>
          </>
        )}
        <dt className="text-[var(--text-lo)]">Last contact</dt>
        <dd className="font-mono text-[var(--text-hi)] text-right">{robot.link === 'online' ? 'live' : timeAgoLabel(sinceContact)}</dd>
      </dl>

      {!started ? (
        <p className="mt-3 text-[10.5px] leading-snug text-[var(--text-lo)] bg-[var(--ink-800)] border border-[var(--line)] rounded px-2 py-1.5">
          Standing by at base. Deploy the fleet to begin.
        </p>
      ) : mode === 'replay' ? (
        <p className="mt-3 text-[10.5px] leading-snug text-[var(--text-lo)] bg-[var(--ink-800)] border border-[var(--line)] rounded px-2 py-1.5">
          Reviewing recorded telemetry — replay is read-only.
        </p>
      ) : robot.link !== 'autonomous' ? (
        <p className="mt-3 text-[10.5px] leading-snug text-[var(--accent)] bg-[var(--accent-dim)] border border-[var(--accent)]/25 rounded px-2 py-1.5">
          Click anywhere checked on the map to redirect {robot.name}.
        </p>
      ) : (
        <p className="mt-3 text-[10.5px] leading-snug text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/25 rounded px-2 py-1.5">
          Operating without contact. Pin shows last confirmed fix, drifting uncertainty grows until signal returns.
        </p>
      )}
    </div>
  )
}
