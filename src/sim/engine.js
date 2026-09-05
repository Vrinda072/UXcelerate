// Deterministic-ish simulation of a multi-robot disaster response mission.
// Everything here is client-side mock data standing in for a real robot fleet feed.

export const COLS = 26
export const ROWS = 16

export const ROBOT_COLORS = ['#3b9eff', '#a78bfa', '#2dd4bf', '#f472b6', '#facc15', '#fb923c']

const BASE = { x: 2, y: ROWS - 3 }

const DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
]

function key(x, y) {
  return `${x},${y}`
}

function inBounds(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS
}

function makeId(prefix, n) {
  return `${prefix}-${String(n).padStart(2, '0')}`
}

let idCounter = 1
function nextEventId() {
  idCounter += 1
  return `evt-${idCounter}`
}

const ROBOT_NAMES = ['Argus', 'Beacon', 'Cinder', 'Drift', 'Ember', 'Finch']

export function createInitialState(seedTime = Date.now()) {
  const cells = {}

  // Reveal a small safe pocket around base so the fleet has somewhere to start.
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const x = BASE.x + dx
      const y = BASE.y + dy
      if (inBounds(x, y)) {
        cells[key(x, y)] = { x, y, state: 'explored', discoveredAt: seedTime }
      }
    }
  }
  cells[key(BASE.x, BASE.y)].isBase = true

  const robots = ROBOT_NAMES.map((name, i) => ({
    id: makeId('rb', i + 1),
    name,
    color: ROBOT_COLORS[i % ROBOT_COLORS.length],
    x: BASE.x + (i % 3) - 1,
    y: BASE.y + Math.floor(i / 3),
    heading: 0,
    status: 'active', // active | degraded | lost
    battery: 82 + Math.round(Math.random() * 15),
    task: 'Exploring sector',
    lastContact: seedTime,
    lostSince: null,
    target: null,
    trail: [],
  }))

  return {
    tick: 0,
    startedAt: seedTime,
    cells,
    robots,
    survivors: [],
    events: [
      {
        id: nextEventId(),
        t: seedTime,
        type: 'system',
        severity: 'info',
        message: 'Fleet deployed from staging base. Mapping underway.',
        acknowledged: true,
      },
    ],
    selectedRobotId: robots[0].id,
    commQuality: 0.9,
    paused: false,
    speed: 1,
  }
}

function pushEvent(state, partial) {
  const evt = {
    id: nextEventId(),
    t: state.startedAt + state.tick * 1000,
    acknowledged: false,
    ...partial,
  }
  state.events.unshift(evt)
  if (state.events.length > 200) state.events.length = 200
  return evt
}

function neighbors(x, y) {
  return DIRS.map((d) => ({ x: x + d.dx, y: y + d.dy })).filter((p) => inBounds(p.x, p.y))
}

function cellAt(state, x, y) {
  return state.cells[key(x, y)]
}

function isTraversable(state, x, y) {
  const c = cellAt(state, x, y)
  return c && (c.state === 'explored')
}

function isFrontier(state, x, y) {
  if (!isTraversable(state, x, y)) return false
  return neighbors(x, y).some((n) => !cellAt(state, n.x, n.y))
}

function stepToward(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return { x: from.x + Math.sign(dx), y: from.y }
  if (dy !== 0) return { x: from.x, y: from.y + Math.sign(dy) }
  if (dx !== 0) return { x: from.x + Math.sign(dx), y: from.y }
  return from
}

function findNearestFrontier(state, from) {
  // BFS over traversable cells only, capped for perf.
  const seen = new Set([key(from.x, from.y)])
  const queue = [{ x: from.x, y: from.y, dist: 0 }]
  let best = null
  let head = 0
  while (head < queue.length && head < 800) {
    const cur = queue[head]
    head += 1
    if (isFrontier(state, cur.x, cur.y) && !(cur.x === from.x && cur.y === from.y)) {
      best = cur
      break
    }
    for (const n of neighbors(cur.x, cur.y)) {
      const k = key(n.x, n.y)
      if (seen.has(k)) continue
      if (!isTraversable(state, n.x, n.y)) continue
      seen.add(k)
      queue.push({ x: n.x, y: n.y, dist: cur.dist + 1 })
    }
  }
  return best
}

function revealAround(state, robot, x, y) {
  const cands = neighbors(x, y).filter((n) => !cellAt(state, n.x, n.y))
  const toReveal = cands.slice(0, 1 + Math.floor(Math.random() * 2))
  for (const n of toReveal) {
    const r = Math.random()
    let cellState = 'explored'
    if (r < 0.1) cellState = 'blocked'
    else if (r < 0.2) cellState = 'hazard'

    state.cells[key(n.x, n.y)] = {
      x: n.x,
      y: n.y,
      state: cellState,
      discoveredAt: state.startedAt + state.tick * 1000,
      discoveredBy: robot.id,
      flashUntil: state.tick + 3,
    }

    if (cellState === 'blocked') {
      pushEvent(state, {
        type: 'blocked',
        severity: 'warn',
        robotId: robot.id,
        message: `${robot.name} found an impassable path at (${n.x}, ${n.y}).`,
        loc: { x: n.x, y: n.y },
      })
    } else if (cellState === 'hazard') {
      pushEvent(state, {
        type: 'hazard',
        severity: 'critical',
        robotId: robot.id,
        message: `${robot.name} flagged a structural hazard at (${n.x}, ${n.y}).`,
        loc: { x: n.x, y: n.y },
      })
    }

    if (cellState !== 'blocked' && state.survivors.length < 14 && Math.random() < 0.045) {
      const survivor = {
        id: `sv-${state.survivors.length + 1}-${n.x}-${n.y}`,
        x: n.x,
        y: n.y,
        status: 'unconfirmed',
        discoveredBy: robot.id,
        discoveredAt: state.startedAt + state.tick * 1000,
      }
      state.survivors.push(survivor)
      pushEvent(state, {
        type: 'survivor',
        severity: 'critical',
        robotId: robot.id,
        survivorId: survivor.id,
        message: `${robot.name} detected a possible survivor at (${n.x}, ${n.y}).`,
        loc: { x: n.x, y: n.y },
      })
    }
  }
}

function maybeClearRoute(state, robot) {
  const nb = neighbors(robot.x, robot.y)
  const blocked = nb.filter((n) => cellAt(state, n.x, n.y)?.state === 'blocked')
  if (blocked.length && Math.random() < 0.05) {
    const cell = blocked[Math.floor(Math.random() * blocked.length)]
    const c = cellAt(state, cell.x, cell.y)
    c.state = 'explored'
    c.flashUntil = state.tick + 3
    pushEvent(state, {
      type: 'route',
      severity: 'good',
      robotId: robot.id,
      message: `${robot.name} cleared a new route at (${cell.x}, ${cell.y}).`,
      loc: { x: cell.x, y: cell.y },
    })
  }
}

function updateComms(state, robot) {
  if (robot.status === 'active') {
    const failChance = 0.012 + (1 - state.commQuality) * 0.05
    if (Math.random() < failChance) {
      robot.status = 'degraded'
      pushEvent(state, {
        type: 'comm-degraded',
        severity: 'warn',
        robotId: robot.id,
        message: `Signal degrading for ${robot.name}. Telemetry may be stale.`,
      })
    } else {
      robot.lastContact = state.startedAt + state.tick * 1000
    }
  } else if (robot.status === 'degraded') {
    const r = Math.random()
    if (r < 0.08) {
      robot.status = 'lost'
      robot.lostSince = state.tick
      pushEvent(state, {
        type: 'comm-lost',
        severity: 'critical',
        robotId: robot.id,
        message: `Lost contact with ${robot.name}. Last known position (${robot.x}, ${robot.y}).`,
      })
    } else if (r < 0.35) {
      robot.status = 'active'
      robot.lastContact = state.startedAt + state.tick * 1000
      pushEvent(state, {
        type: 'comm-restored',
        severity: 'good',
        robotId: robot.id,
        message: `Signal restored for ${robot.name}.`,
      })
    } else {
      robot.lastContact = state.startedAt + state.tick * 1000
    }
  } else if (robot.status === 'lost') {
    if (Math.random() < 0.05) {
      robot.status = 'degraded'
      robot.lostSince = null
      robot.lastContact = state.startedAt + state.tick * 1000
      pushEvent(state, {
        type: 'comm-restored',
        severity: 'good',
        robotId: robot.id,
        message: `Intermittent signal recovered from ${robot.name}.`,
      })
    }
  }
}

function moveRobot(state, robot) {
  if (robot.status === 'lost') return // no telemetry, no movement we can observe

  let dest = robot.target
  if (!dest || !isTraversable(state, dest.x, dest.y) || (dest.x === robot.x && dest.y === robot.y)) {
    dest = findNearestFrontier(state, robot)
    robot.target = dest
  }

  let next = { x: robot.x, y: robot.y }
  if (dest) {
    next = stepToward(robot, dest)
    if (!isTraversable(state, next.x, next.y) && !isFrontier(state, robot.x, robot.y)) {
      next = { x: robot.x, y: robot.y }
    }
  } else {
    const opts = neighbors(robot.x, robot.y).filter((n) => isTraversable(state, n.x, n.y))
    if (opts.length) next = opts[Math.floor(Math.random() * opts.length)]
  }

  if (next.x !== robot.x || next.y !== robot.y) {
    robot.heading = Math.atan2(next.y - robot.y, next.x - robot.x)
    robot.trail.push({ x: robot.x, y: robot.y })
    if (robot.trail.length > 6) robot.trail.shift()
    robot.x = next.x
    robot.y = next.y
  }

  if (isFrontier(state, robot.x, robot.y) || Math.random() < 0.3) {
    revealAround(state, robot, robot.x, robot.y)
  }
  maybeClearRoute(state, robot)

  robot.battery = Math.max(0, robot.battery - 0.05)
  if (robot.battery < 20 && robot.task !== 'Returning to base (low battery)') {
    robot.task = 'Returning to base (low battery)'
    pushEvent(state, {
      type: 'battery',
      severity: 'warn',
      robotId: robot.id,
      message: `${robot.name} battery low (${Math.round(robot.battery)}%). Recommend recall.`,
    })
  } else if (robot.battery >= 20 && robot.task === 'Returning to base (low battery)') {
    robot.task = 'Exploring sector'
  }
}

export function tick(prevState) {
  const state = structuredCloneLite(prevState)
  state.tick += 1

  state.commQuality = Math.min(1, Math.max(0.35, state.commQuality + (Math.random() - 0.5) * 0.06))

  for (const robot of state.robots) {
    updateComms(state, robot)
    if (robot.status !== 'lost') moveRobot(state, robot)
  }

  return state
}

function structuredCloneLite(state) {
  return {
    ...state,
    cells: { ...state.cells },
    robots: state.robots.map((r) => ({ ...r, target: r.target ? { ...r.target } : null, trail: [...r.trail] })),
    survivors: state.survivors.map((s) => ({ ...s })),
    events: state.events.map((e) => ({ ...e })),
  }
}

export function mapCoverage(state) {
  const total = COLS * ROWS
  const known = Object.keys(state.cells).length
  return known / total
}

export function timeAgoLabel(ms) {
  const s = Math.floor(ms / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m ago`
}

export { BASE, key, isTraversable }
