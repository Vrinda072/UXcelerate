import { useMission } from './sim/useMission'
import TopBar from './components/TopBar'
import FleetList from './components/FleetList'
import MapCanvas from './components/MapCanvas'
import Legend from './components/Legend'
import CriticalAlerts from './components/CriticalAlerts'
import RobotDetailPanel from './components/RobotDetailPanel'
import EventFeed from './components/EventFeed'

export default function App() {
  const { state, actions } = useMission()
  const now = state.startedAt + state.tick * 1000
  const selectedRobot = state.robots.find((r) => r.id === state.selectedRobotId)

  return (
    <div className="h-screen flex flex-col bg-[#0a0e14] text-slate-200">
      <TopBar state={state} actions={actions} />
      <div className="flex-1 flex min-h-0">
        <FleetList state={state} selectedRobotId={state.selectedRobotId} onSelectRobot={actions.selectRobot} />

        <main className="flex-1 relative min-w-0">
          <MapCanvas
            state={state}
            selectedRobotId={state.selectedRobotId}
            onSelectRobot={actions.selectRobot}
            onCellClick={(x, y) => actions.sendRobotTo(state.selectedRobotId, x, y)}
          />
          <Legend />
          <CriticalAlerts state={state} onAcknowledge={actions.acknowledgeEvent} onDispatch={actions.dispatchNearestRobot} />
        </main>

        <aside className="w-80 shrink-0 border-l border-slate-800 bg-[#0d131b] flex flex-col min-h-0">
          <RobotDetailPanel robot={selectedRobot} now={now} />
          <EventFeed
            state={state}
            now={now}
            onAcknowledge={actions.acknowledgeEvent}
            onDispatch={actions.dispatchNearestRobot}
            onSetSurvivorStatus={actions.setSurvivorStatus}
          />
        </aside>
      </div>
    </div>
  )
}
