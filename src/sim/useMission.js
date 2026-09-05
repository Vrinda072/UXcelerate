import { useCallback, useEffect, useRef, useState } from 'react'
import { createInitialState, beginMission, tick, isTraversable } from './engine'
import { nearestUnit } from './robotState'

const TICK_MS = 1000
const MAX_HISTORY = 600

export function useMission() {
  const [liveState, setLiveState] = useState(() => createInitialState())
  const stateRef = useRef(liveState)
  useEffect(() => {
    stateRef.current = liveState
  }, [liveState])

  const [history, setHistory] = useState([])
  const historyRef = useRef([])

  const [mode, setModeState] = useState('live')
  const [replayIndex, setReplayIndex] = useState(0)

  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const carryRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return
      if (stateRef.current.phase !== 'running') return
      carryRef.current += speedRef.current
      let next = stateRef.current
      let advanced = false
      while (carryRef.current >= 1) {
        carryRef.current -= 1
        next = tick(next)
        historyRef.current.push(next)
        advanced = true
      }
      if (advanced) {
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current = historyRef.current.slice(historyRef.current.length - MAX_HISTORY)
        }
        stateRef.current = next
        setLiveState(next)
        setHistory(historyRef.current)
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const start = useCallback(() => {
    const next = beginMission(stateRef.current)
    stateRef.current = next
    historyRef.current = [next]
    setHistory(historyRef.current)
    setLiveState(next)
  }, [])

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current
    setLiveState((s) => ({ ...s, paused: pausedRef.current }))
  }, [])

  const setSpeed = useCallback((v) => {
    speedRef.current = v
    setLiveState((s) => ({ ...s, speed: v }))
  }, [])

  const selectRobot = useCallback((id) => {
    setLiveState((s) => ({ ...s, selectedRobotId: id }))
  }, [])

  const acknowledgeEvent = useCallback((eventId) => {
    setLiveState((s) => ({
      ...s,
      events: s.events.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e)),
    }))
  }, [])

  const setSurvivorStatus = useCallback((survivorId, status) => {
    setLiveState((s) => ({
      ...s,
      survivors: s.survivors.map((sv) => (sv.id === survivorId ? { ...sv, status } : sv)),
    }))
  }, [])

  const sendRobotTo = useCallback((robotId, x, y) => {
    setLiveState((s) => {
      if (!isTraversable(s, x, y)) return s
      return {
        ...s,
        robots: s.robots.map((r) =>
          r.id === robotId && r.link !== 'autonomous'
            ? { ...r, target: { x, y }, assignment: 'manual', assignedSurvivorId: null, routePath: null }
            : r,
        ),
      }
    })
  }, [])

  const dispatchNearestRobot = useCallback((survivorId) => {
    setLiveState((s) => {
      const sv = s.survivors.find((x) => x.id === survivorId)
      if (!sv) return s
      const unit = nearestUnit(s.robots, sv)
      if (!unit) return s
      const nearest = unit.robot
      return {
        ...s,
        robots: s.robots.map((r) =>
          r.id === nearest.id
            ? { ...r, target: { x: sv.x, y: sv.y }, assignment: 'survivor', assignedSurvivorId: sv.id, routePath: null }
            : r,
        ),
        survivors: s.survivors.map((s2) => (s2.id === survivorId ? { ...s2, assignedRobotId: nearest.id } : s2)),
        selectedRobotId: nearest.id,
      }
    })
  }, [])

  const enterReplay = useCallback(() => {
    setModeState('replay')
    setReplayIndex(Math.max(0, historyRef.current.length - 1))
  }, [])

  const exitReplay = useCallback(() => {
    setModeState('live')
  }, [])

  const scrub = useCallback((index) => {
    setReplayIndex(Math.max(0, Math.min(index, historyRef.current.length - 1)))
  }, [])

  const activeState = mode === 'replay' ? history[replayIndex] || liveState : liveState

  return {
    state: activeState,
    liveState,
    mode,
    history,
    replayIndex,
    actions: {
      start,
      togglePause,
      setSpeed,
      selectRobot,
      acknowledgeEvent,
      setSurvivorStatus,
      sendRobotTo,
      dispatchNearestRobot,
      enterReplay,
      exitReplay,
      scrub,
    },
  }
}
