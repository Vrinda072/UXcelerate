import { useCallback, useEffect, useRef, useState } from 'react'
import { createInitialState, tick, isTraversable } from './engine'

const TICK_MS = 1000

export function useMission() {
  const [state, setState] = useState(() => createInitialState())
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const carryRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return
      carryRef.current += speedRef.current
      while (carryRef.current >= 1) {
        carryRef.current -= 1
        setState((s) => tick(s))
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current
    setState((s) => ({ ...s, paused: pausedRef.current }))
  }, [])

  const setSpeed = useCallback((v) => {
    speedRef.current = v
    setState((s) => ({ ...s, speed: v }))
  }, [])

  const selectRobot = useCallback((id) => {
    setState((s) => ({ ...s, selectedRobotId: id }))
  }, [])

  const acknowledgeEvent = useCallback((eventId) => {
    setState((s) => ({
      ...s,
      events: s.events.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e)),
    }))
  }, [])

  const setSurvivorStatus = useCallback((survivorId, status) => {
    setState((s) => ({
      ...s,
      survivors: s.survivors.map((sv) => (sv.id === survivorId ? { ...sv, status } : sv)),
    }))
  }, [])

  const sendRobotTo = useCallback((robotId, x, y) => {
    setState((s) => {
      if (!isTraversable(s, x, y)) return s
      return {
        ...s,
        robots: s.robots.map((r) =>
          r.id === robotId && r.status !== 'lost'
            ? { ...r, target: { x, y }, task: 'Manual waypoint' }
            : r,
        ),
      }
    })
  }, [])

  const dispatchNearestRobot = useCallback((survivorId) => {
    setState((s) => {
      const sv = s.survivors.find((x) => x.id === survivorId)
      if (!sv) return s
      const candidates = s.robots.filter((r) => r.status === 'active')
      if (!candidates.length) return s
      let nearest = candidates[0]
      let best = Infinity
      for (const r of candidates) {
        const d = Math.abs(r.x - sv.x) + Math.abs(r.y - sv.y)
        if (d < best) {
          best = d
          nearest = r
        }
      }
      return {
        ...s,
        robots: s.robots.map((r) =>
          r.id === nearest.id ? { ...r, target: { x: sv.x, y: sv.y }, task: `Assisting survivor ${sv.id}` } : r,
        ),
        selectedRobotId: nearest.id,
      }
    })
  }, [])

  return {
    state,
    actions: {
      togglePause,
      setSpeed,
      selectRobot,
      acknowledgeEvent,
      setSurvivorStatus,
      sendRobotTo,
      dispatchNearestRobot,
    },
  }
}
