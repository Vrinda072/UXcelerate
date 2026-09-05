import { useRef, useState, useCallback } from 'react'
import { useMission } from './sim/useMission'
import TopBar from './components/TopBar'
import FleetList from './components/FleetList'
import MapView from './components/MapView'
import Legend from './components/Legend'
import SurvivorAlert from './components/SurvivorAlert'
import RobotDetailPanel from './components/RobotDetailPanel'
import EventFeed from './components/EventFeed'
import ReplayBar from './components/ReplayBar'

function MissionStartOverlay({ onStart, robotCount }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--ink-950)]/55 backdrop-blur-[2px]">
      <div className="fade-in max-w-sm text-center px-6 py-7 rounded-xl border border-[var(--line)] bg-[var(--ink-950)]/95 shadow-2xl shadow-black/60">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-lo)] mb-2">SECTOR STANDBY</p>
        <h2 className="text-lg font-semibold text-[var(--text-hi)] mb-2">{robotCount} units staged at base</h2>
        <p className="text-[12.5px] text-[var(--text-lo)] leading-relaxed mb-5">
          Regional seismic sensors indicate an active event. Deploy the fleet to begin structural assessment and search
          for survivors.
        </p>
        <button
          onClick={onStart}
          className="w-full py-2.5 rounded-lg bg-[var(--danger)] hover:brightness-110 text-white text-[12.5px] font-bold tracking-wide"
        >
          BEGIN MISSION — DEPLOY FLEET
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { state, mode, history, replayIndex, actions } = useMission()
  const now = state.startedAt + state.tick * 1000
  const selectedRobot = state.robots.find((r) => r.id === state.selectedRobotId)
  const mapRef = useRef(null)
  const [showComms, setShowComms] = useState(false)

  const interactive = mode === 'live' && state.phase === 'running'

  const handleStart = useCallback(() => {
    actions.start()
    requestAnimationFrame(() => mapRef.current?.shake())
  }, [actions])

  const handleFocusEvent = useCallback(
    (evt) => {
      if (evt.robotId) actions.selectRobot(evt.robotId)
      if (evt.loc) mapRef.current?.flyTo(evt.loc.x, evt.loc.y)
    },
    [actions],
  )

  const handleSelectRobot = useCallback(
    (id) => {
      actions.selectRobot(id)
      const robot = state.robots.find((r) => r.id === id)
      if (robot) mapRef.current?.flyTo(robot.x, robot.y)
    },
    [actions, state.robots],
  )

  const handleDispatch = useCallback(
    (survivorId) => {
      const survivor = state.survivors.find((s) => s.id === survivorId)
      actions.dispatchNearestRobot(survivorId)
      if (survivor) mapRef.current?.flyTo(survivor.x, survivor.y)
    },
    [actions, state.survivors],
  )

  return (
    <div className="h-screen w-screen overflow-x-auto bg-[var(--ink-900)] text-[var(--text-hi)]">
      <div className="h-full min-w-[1080px] flex flex-col">
        <TopBar state={state} mode={mode} actions={actions} showComms={showComms} onToggleComms={() => setShowComms((v) => !v)} />
        <div className="flex-1 flex min-h-0">
          <FleetList state={state} selectedRobotId={state.selectedRobotId} onSelectRobot={handleSelectRobot} />

          <main className="flex-1 relative min-w-0">
            <MapView
              ref={mapRef}
              state={state}
              selectedRobotId={state.selectedRobotId}
              onSelectRobot={handleSelectRobot}
              onCellClick={(x, y) => actions.sendRobotTo(state.selectedRobotId, x, y)}
              interactive={interactive}
              showComms={showComms}
            />
            <Legend showComms={showComms} />
            {interactive && <SurvivorAlert state={state} onAcknowledge={actions.acknowledgeEvent} onDispatch={handleDispatch} />}
            {state.phase === 'ready' && <MissionStartOverlay onStart={handleStart} robotCount={state.robots.length} />}
            {mode === 'replay' && <ReplayBar history={history} replayIndex={replayIndex} onScrub={actions.scrub} onExit={actions.exitReplay} />}
          </main>

          <aside className="w-72 shrink-0 border-l border-[var(--line)] bg-[var(--ink-950)] flex flex-col min-h-0">
            <RobotDetailPanel robot={selectedRobot} now={now} mode={mode} started={state.phase === 'running'} />
            <EventFeed
              state={state}
              onAcknowledge={actions.acknowledgeEvent}
              onDispatch={handleDispatch}
              onSetSurvivorStatus={actions.setSurvivorStatus}
              onFocusEvent={handleFocusEvent}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
