import { timeAgoLabel } from '../sim/engine'

const STATUS_TEXT = {
  active: { label: 'Online', tone: 'text-emerald-400' },
  degraded: { label: 'Weak signal — updates may lag', tone: 'text-amber-400' },
  lost: { label: 'No contact — showing last known spot', tone: 'text-red-400' },
}

export default function RobotDetailPanel({ robot, now }) {
  if (!robot) {
    return <div className="p-4 text-sm text-slate-500 border-b border-slate-800">Select a robot to see its details.</div>
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
        <p className="mt-2.5 text-[11px] text-teal-300/80 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-1.5">
          Click anywhere on the checked map to send {robot.name} there.
        </p>
      ) : (
        <p className="mt-2.5 text-[11px] text-red-300/80 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
          Can't redirect {robot.name} while contact is lost. The pin shows where it was last seen — it may have moved
          since.
        </p>
      )}
    </div>
  )
}
