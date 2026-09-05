import { timeAgoLabel } from '../sim/engine'

const STATUS_TEXT = {
  active: { label: 'Online', tone: 'text-emerald-400' },
  degraded: { label: 'Weak signal — telemetry may lag', tone: 'text-amber-400' },
  lost: { label: 'No contact — position is last known, not current', tone: 'text-red-400' },
}

export default function RobotDetailPanel({ robot, now }) {
  if (!robot) {
    return (
      <div className="p-4 text-sm text-slate-500 border-b border-slate-800">Select a robot to view telemetry.</div>
    )
  }

  const status = STATUS_TEXT[robot.status]
  const sinceContact = now - robot.lastContact

  return (
    <div className="p-3 border-b border-slate-800">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: robot.color }} />
        <h3 className="text-sm font-semibold text-slate-100">{robot.name}</h3>
        <span className="text-[10px] text-slate-500 ml-auto">{robot.id}</span>
      </div>
      <p className={`text-xs mb-2 ${status.tone}`}>{status.label}</p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-slate-500">Position</dt>
        <dd className="text-slate-200 tabular-nums">
          ({robot.x}, {robot.y})
        </dd>
        <dt className="text-slate-500">Battery</dt>
        <dd className={robot.battery < 20 ? 'text-amber-400' : 'text-slate-200'}>{Math.round(robot.battery)}%</dd>
        <dt className="text-slate-500">Current task</dt>
        <dd className="text-slate-200 truncate" title={robot.task}>
          {robot.task}
        </dd>
        <dt className="text-slate-500">Last contact</dt>
        <dd className="text-slate-200">{robot.status === 'active' ? 'live' : timeAgoLabel(sinceContact)}</dd>
      </dl>

      {robot.status !== 'lost' ? (
        <p className="mt-2.5 text-[11px] text-sky-300/80 bg-sky-500/10 border border-sky-500/20 rounded px-2 py-1.5">
          Click any explored map tile to send {robot.name} there manually.
        </p>
      ) : (
        <p className="mt-2.5 text-[11px] text-red-300/80 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
          Manual routing unavailable while contact is lost. Shown position is the last confirmed fix — actual location may
          have drifted.
        </p>
      )}
    </div>
  )
}
