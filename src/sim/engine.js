// Simulation of a multi-robot earthquake-response mission.
// Everything here is client-side mock data standing in for a real robot fleet feed.

export const COLS = 22
export const ROWS = 14

export const ROBOT_COLORS = ['#38bdf8', '#a78bfa', '#2dd4bf', '#fb7185', '#fbbf24', '#818cf8']

// The grid is projected onto a real map so the interface reads as an actual
// place, not an abstract board. One grid cell is roughly one city block.
export const ORIGIN_LAT = 37.765
export const ORIGIN_LNG = -122.43
export const CELL_LAT_DEG = 0.00085
export const CELL_LNG_DEG = 0.00108

export function gridToLatLng(x, y) {
  return { lat: ORIGIN_LAT - y * CELL_LAT_DEG, lng: ORIGIN_LNG + x * CELL_LNG_DEG }
}

export function latLngToGrid(lat, lng) {
  return {
    x: Math.round((lng - ORIGIN_LNG) / CELL_LNG_DEG),
    y: Math.round((ORIGIN_LAT - lat) / CELL_LAT_DEG),
  }
}

const BASE = { x: 2, y: ROWS - 3 }

// Fixed communication dead zones (e.g. a parking structure, a below-grade
// stretch) — robots inside lose link far more often, and fall back to
// autonomous operation rather than waiting for instructions.
export const DEAD_ZONES = [
  { x: 16, y: 4, r: 2.4 },
  { x: 7, y: 10, r: 2 },
]

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

export function inDeadZone(x, y) {
  return DEAD_ZONES.some((z) => Math.hypot(x - z.x, y - z.y) <= z.r)
}

export function createInitialState(seedTime = Date.now()) {
  const cells = {}

  // Reveal a small safe pocket around base so the fleet has somewhere to start.
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = BASE.x + dx
      const y = BASE.y + dy
      if (inBounds(x, y)) {
        cells[key(x, y)] = { x, y, state: 'explored', tier: 'verified', discoveredAt: seedTime }
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
    prevX: BASE.x + (i % 3) - 1,
    prevY: BASE.y + Math.floor(i / 3),
    heading: 0,
    link: 'online', // online | degraded | autonomous
    activity: 'idle', // idle | searching | traveling | investigating | survivor_detected | returning | low_battery | mission_complete
    battery: 86 + Math.round(Math.random() * 12),
    lastContact: seedTime,
    autonomousSince: null,
    target: null,
    routePath: null,
    assignment: null, // null | 'survivor' | 'manual'
    assignedSurvivorId: null,
    justDetectedUntil: 0,
    trail: [],
    discoveries: 0,
  }))

  return {
    phase: 'ready', // ready | running
    mode: 'live',
    tick: 0,
    startedAt: seedTime,
    quakeMagnitude: null,
    cells,
    robots,
    survivors: [],
    deadZones: DEAD_ZONES,
    events: [
      {
        id: nextEventId(),
        t: seedTime,
        type: 'system',
        severity: 'info',
        message: 'Fleet on standby at staging base. Awaiting mission start.',
        acknowledged: true,
      },
    ],
    selectedRobotId: robots[0].id,
    commQuality: 0.92,
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
  if (state.events.length > 300) state.events.length = 300
  return evt
}

function neighbors(x, y) {
  return DIRS.map((d) => ({ x: x + d.dx, y: y + d.dy })).filter((p) => inBounds(p.x, p.y))
}

function cellAt(state, x, y) {
  return state.cells[key(x, y)]
}

export function isTraversable(state, x, y) {
  const c = cellAt(state, x, y)
  return Boolean(c && c.state === 'explored')
}

function isFrontier(state, x, y) {
  if (!isTraversable(state, x, y)) return false
  return neighbors(x, y).some((n) => !cellAt(state, n.x, n.y))
}

// Breadth-first path search over already-traversable cells only. Cheap at
// this grid size, so we can afford to call it every tick — which is what
// gives us "the route recalculates when a road turns out to be blocked" for
// free: next tick's search simply routes around the new obstacle.
function bfsPath(state, from, to) {
  if (!isTraversable(state, to.x, to.y) && !(to.x === from.x && to.y === from.y)) return null
  const startKey = key(from.x, from.y)
  const cameFrom = new Map()
  const seen = new Set([startKey])
  const queue = [{ x: from.x, y: from.y }]
  let head = 0
  let found = from.x === to.x && from.y === to.y
  while (head < queue.length && head < 1000 && !found) {
    const cur = queue[head]
    head += 1
    for (const n of neighbors(cur.x, cur.y)) {
      const k = key(n.x, n.y)
      if (seen.has(k)) continue
      if (!isTraversable(state, n.x, n.y)) continue
      seen.add(k)
      cameFrom.set(k, cur)
      if (n.x === to.x && n.y === to.y) {
        found = true
        break
      }
      queue.push(n)
    }
  }
  if (!found) return null
  const path = [to]
  let curKey = key(to.x, to.y)
  while (curKey !== startKey) {
    const prev = cameFrom.get(curKey)
    if (!prev) break
    path.push(prev)
    curKey = key(prev.x, prev.y)
  }
  path.reverse()
  return path
}

function findNearestFrontier(state, from) {
  const seen = new Set([key(from.x, from.y)])
  const queue = [{ x: from.x, y: from.y }]
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
      queue.push({ x: n.x, y: n.y })
    }
  }
  return best
}

const CONDITIONS = [
  { label: 'Critical', weight: 0.25 },
  { label: 'Injured', weight: 0.45 },
  { label: 'Stable', weight: 0.3 },
]

function rollCondition() {
  const r = Math.random()
  let acc = 0
  for (const c of CONDITIONS) {
    acc += c.weight
    if (r <= acc) return c.label
  }
  return 'Stable'
}

function revealAround(state, robot, x, y) {
  const cands = neighbors(x, y).filter((n) => !cellAt(state, n.x, n.y))
  const toReveal = cands.slice(0, Math.random() < 0.25 ? 2 : 1)
  for (const n of toReveal) {
    const r = Math.random()
    let cellState = 'explored'
    if (r < 0.07) cellState = 'blocked'
    else if (r < 0.13) cellState = 'hazard'

    state.cells[key(n.x, n.y)] = {
      x: n.x,
      y: n.y,
      state: cellState,
      tier: cellState === 'explored' ? 'scanned' : 'flagged',
      discoveredAt: state.startedAt + state.tick * 1000,
      discoveredBy: robot.id,
      flashUntil: state.tick + 3,
    }
    robot.discoveries += 1

    if (cellState === 'blocked') {
      pushEvent(state, {
        type: 'blocked',
        severity: 'warn',
        robotId: robot.id,
        message: `${robot.name} found a blocked road nearby.`,
        loc: { x: n.x, y: n.y },
      })
    } else if (cellState === 'hazard') {
      pushEvent(state, {
        type: 'hazard',
        severity: 'critical',
        robotId: robot.id,
        message: `${robot.name} flagged a structural hazard nearby.`,
        loc: { x: n.x, y: n.y },
      })
    }

    if (cellState !== 'blocked' && state.survivors.length < 9 && Math.random() < 0.04) {
      const survivor = {
        id: `sv-${state.survivors.length + 1}-${n.x}-${n.y}`,
        x: n.x,
        y: n.y,
        status: 'unconfirmed',
        confidence: 62 + Math.round(Math.random() * 36),
        condition: rollCondition(),
        discoveredBy: robot.id,
        discoveredAt: state.startedAt + state.tick * 1000,
      }
      state.survivors.push(survivor)
      robot.justDetectedUntil = state.tick + 3
      pushEvent(state, {
        type: 'survivor',
        severity: 'critical',
        robotId: robot.id,
        survivorId: survivor.id,
        message: `${robot.name} detected a possible survivor — confidence ${survivor.confidence}%, condition ${survivor.condition}.`,
        loc: { x: n.x, y: n.y },
      })
    }
  }
}

function maybeClearRoute(state, robot) {
  const nb = neighbors(robot.x, robot.y)
  const blocked = nb.filter((n) => cellAt(state, n.x, n.y)?.state === 'blocked')
  if (blocked.length && Math.random() < 0.04) {
    const cell = blocked[Math.floor(Math.random() * blocked.length)]
    const c = cellAt(state, cell.x, cell.y)
    c.state = 'explored'
    c.tier = 'scanned'
    c.flashUntil = state.tick + 3
    pushEvent(state, {
      type: 'route',
      severity: 'good',
      robotId: robot.id,
      message: `${robot.name} cleared a blocked road — new route available.`,
      loc: { x: cell.x, y: cell.y },
    })
  }
}

function updateComms(state, robot) {
  const hot = inDeadZone(robot.x, robot.y)
  if (robot.link === 'online') {
    const base = 0.006 + (1 - state.commQuality) * 0.03
    const failChance = hot ? base * 7 : base
    if (Math.random() < failChance) {
      robot.link = 'degraded'
      pushEvent(state, {
        type: 'comm-degraded',
        severity: 'warn',
        robotId: robot.id,
        message: `Signal degrading for ${robot.name}. Telemetry may lag.`,
      })
    } else {
      robot.lastContact = state.startedAt + state.tick * 1000
    }
  } else if (robot.link === 'degraded') {
    const r = Math.random()
    const dropChance = hot ? 0.22 : 0.05
    if (r < dropChance) {
      robot.link = 'autonomous'
      robot.autonomousSince = state.tick
      pushEvent(state, {
        type: 'comm-lost',
        severity: 'critical',
        robotId: robot.id,
        message: hot
          ? `${robot.name} entered a communication dead zone — switched to AUTONOMOUS MODE.`
          : `Lost contact with ${robot.name} — switched to AUTONOMOUS MODE.`,
      })
    } else if (r < dropChance + 0.35) {
      robot.link = 'online'
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
  } else if (robot.link === 'autonomous') {
    const recoverChance = hot ? 0.01 : 0.05
    if (Math.random() < recoverChance) {
      robot.link = 'degraded'
      robot.autonomousSince = null
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

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function updateActivity(state, robot) {
  if (robot.battery < 15) {
    robot.activity = 'low_battery'
    return
  }
  if (robot.justDetectedUntil && state.tick < robot.justDetectedUntil) {
    robot.activity = 'survivor_detected'
    return
  }
  if (robot.assignment === 'survivor' && robot.target) {
    robot.activity = distance(robot, robot.target) <= 1 ? 'investigating' : 'traveling'
    return
  }
  if (robot.assignment === 'manual' && robot.target) {
    robot.activity = 'traveling'
    return
  }
  if (mapConfidence(state) > 0.985) {
    robot.activity = 'mission_complete'
    return
  }
  robot.activity = 'searching'
}

function moveRobot(state, robot) {
  if (robot.link === 'autonomous') return // no telemetry — last known position holds

  robot.prevX = robot.x
  robot.prevY = robot.y

  let dest = robot.target
  const hasAssignment = robot.assignment != null

  if (hasAssignment && dest) {
    robot.routePath = bfsPath(state, robot, dest)
    if (dest.x === robot.x && dest.y === robot.y) {
      robot.assignment = null
      robot.assignedSurvivorId = null
      robot.target = null
      robot.routePath = null
      dest = null
    }
  } else if (!dest || !isTraversable(state, dest.x, dest.y) || (dest.x === robot.x && dest.y === robot.y)) {
    dest = findNearestFrontier(state, robot)
    robot.target = dest
    robot.routePath = null
  }

  let next = { x: robot.x, y: robot.y }
  if (hasAssignment && robot.routePath && robot.routePath.length > 1) {
    next = robot.routePath[1]
  } else if (dest) {
    const dx = dest.x - robot.x
    const dy = dest.y - robot.y
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) next = { x: robot.x + Math.sign(dx), y: robot.y }
    else if (dy !== 0) next = { x: robot.x, y: robot.y + Math.sign(dy) }
    else if (dx !== 0) next = { x: robot.x + Math.sign(dx), y: robot.y }
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

  const cell = cellAt(state, robot.x, robot.y)
  if (cell && cell.state === 'explored' && cell.tier === 'scanned') {
    cell.tier = 'verified'
  }

  if (!hasAssignment) {
    const atFrontier = isFrontier(state, robot.x, robot.y)
    if ((atFrontier && Math.random() < 0.4) || Math.random() < 0.05) {
      revealAround(state, robot, robot.x, robot.y)
    }
    maybeClearRoute(state, robot)
  }

  robot.battery = Math.max(0, robot.battery - (hasAssignment ? 0.07 : 0.045))
}

export function beginMission(prevState) {
  const state = structuredCloneLite(prevState)
  state.phase = 'running'
  state.quakeMagnitude = (5.6 + Math.random() * 1.4).toFixed(1)
  state.commQuality = 0.4

  pushEvent(state, {
    type: 'quake',
    severity: 'critical',
    message: `Seismic event confirmed — magnitude ${state.quakeMagnitude}. Beginning search and rescue assessment.`,
  })

  // The quake's damage is discovered immediately around each robot's start
  // position, rather than trickling in — it already happened.
  for (const robot of state.robots) {
    revealAround(state, robot, robot.x, robot.y)
    revealAround(state, robot, robot.x, robot.y)
  }

  pushEvent(state, {
    type: 'system',
    severity: 'warn',
    message: 'Regional communications infrastructure degraded. Expect intermittent signal loss.',
  })

  return state
}

export function tick(prevState) {
  if (prevState.phase !== 'running') return prevState
  const state = structuredCloneLite(prevState)
  state.tick += 1

  const target = Math.min(0.94, 0.4 + state.tick * 0.0016)
  state.commQuality = Math.min(1, Math.max(0.3, target + (Math.random() - 0.5) * 0.08))

  for (const robot of state.robots) {
    updateComms(state, robot)
    if (robot.link !== 'autonomous') moveRobot(state, robot)
    updateActivity(state, robot)
  }

  return state
}

function structuredCloneLite(state) {
  return {
    ...state,
    cells: { ...state.cells },
    robots: state.robots.map((r) => ({
      ...r,
      target: r.target ? { ...r.target } : null,
      routePath: r.routePath ? r.routePath.map((p) => ({ ...p })) : null,
      trail: [...r.trail],
    })),
    survivors: state.survivors.map((s) => ({ ...s })),
    events: state.events.map((e) => ({ ...e })),
  }
}

const TIER_CONFIDENCE = { verified: 1, scanned: 0.55, flagged: 0.55 }

export function mapConfidence(state) {
  const total = COLS * ROWS
  let sum = 0
  for (const k in state.cells) {
    sum += TIER_CONFIDENCE[state.cells[k].tier] ?? 0.55
  }
  return sum / total
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

export function missionClock(tickCount) {
  const h = Math.floor(tickCount / 3600)
  const m = Math.floor((tickCount % 3600) / 60)
  const s = tickCount % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export { BASE, key }
