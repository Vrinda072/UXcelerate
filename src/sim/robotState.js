const ACTIVITY_LABEL = {
  idle: 'Idle',
  searching: 'Searching',
  traveling: 'Traveling',
  investigating: 'Investigating',
  survivor_detected: 'Survivor detected',
  low_battery: 'Low battery',
  mission_complete: 'Mission complete',
}

const ACTIVITY_TONE = {
  idle: 'neutral',
  searching: 'neutral',
  traveling: 'accent',
  investigating: 'warn',
  survivor_detected: 'danger',
  low_battery: 'warn',
  mission_complete: 'ok',
}

// A robot's headline state prioritizes link health (an operator needs to
// know "can I trust this data" before "what is it doing") over its task.
export function robotStateLabel(robot) {
  if (robot.link === 'autonomous') return { label: 'Autonomous mode', tone: 'danger' }
  if (robot.link === 'degraded') return { label: 'Comm degraded', tone: 'warn' }
  return { label: ACTIVITY_LABEL[robot.activity] ?? 'Searching', tone: ACTIVITY_TONE[robot.activity] ?? 'neutral' }
}

export const TONE_TEXT_CLASS = {
  neutral: 'text-[var(--text-lo)]',
  accent: 'text-[var(--accent)]',
  ok: 'text-[var(--ok)]',
  warn: 'text-[var(--warn)]',
  danger: 'text-[var(--danger)]',
}

const CELL_METERS = 90

export function nearestUnit(robots, survivor) {
  const eligible = robots.filter((r) => r.link !== 'autonomous')
  // Prefer sending a different unit than the one that made the discovery —
  // it reads as fleet coordination rather than a robot "rescuing" itself.
  const others = eligible.filter((r) => r.id !== survivor.discoveredBy)
  const candidates = others.length ? others : eligible
  if (!candidates.length) return null
  let best = candidates[0]
  let bestDist = Infinity
  for (const r of candidates) {
    const d = Math.abs(r.x - survivor.x) + Math.abs(r.y - survivor.y)
    if (d < bestDist) {
      bestDist = d
      best = r
    }
  }
  return { robot: best, distanceMeters: bestDist * CELL_METERS }
}

export const TONE_DOT_CLASS = {
  neutral: 'bg-[var(--text-lo)]',
  accent: 'bg-[var(--accent)]',
  ok: 'bg-[var(--ok)]',
  warn: 'bg-[var(--warn)]',
  danger: 'bg-[var(--danger)]',
}

export const TONE_PILL_CLASS = {
  neutral: 'bg-[var(--ink-700)] text-[var(--text-lo)]',
  accent: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  ok: 'bg-[var(--ok)]/15 text-[var(--ok)]',
  warn: 'bg-[var(--warn)]/15 text-[var(--warn)]',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)]',
}
