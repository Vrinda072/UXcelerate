import { COLS, ROWS, key } from '../sim/engine'

const CELL = 27

function cellFill(state) {
  switch (state) {
    case 'explored':
      return '#1a2430'
    case 'blocked':
      return '#241a1a'
    case 'hazard':
      return '#2e1a14'
    default:
      return '#0c1119'
  }
}

function isFrontierCell(cells, x, y) {
  const c = cells[key(x, y)]
  if (!c || c.state !== 'explored') return false
  const around = [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ]
  return around.some(([nx, ny]) => nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !cells[key(nx, ny)])
}

export default function MapCanvas({ state, selectedRobotId, onSelectRobot, onCellClick }) {
  const cells = state.cells
  const w = COLS * CELL
  const h = ROWS * CELL
  const selectedRobot = state.robots.find((r) => r.id === selectedRobotId)

  const gridCells = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = cells[key(x, y)]
      const known = Boolean(c)
      const frontier = known && isFrontierCell(cells, x, y)
      const clickable = known && c.state === 'explored'
      gridCells.push(
        <g key={`${x}-${y}`}>
          <rect
            x={x * CELL}
            y={y * CELL}
            width={CELL}
            height={CELL}
            fill={cellFill(known ? c.state : 'unknown')}
            stroke={known ? '#26313f' : '#111826'}
            strokeWidth="1"
            className={clickable ? 'cursor-crosshair' : ''}
            onClick={clickable && selectedRobot ? () => onCellClick(x, y) : undefined}
          />
          {frontier && (
            <rect
              x={x * CELL + 1.5}
              y={y * CELL + 1.5}
              width={CELL - 3}
              height={CELL - 3}
              fill="none"
              stroke="#3b9eff"
              strokeOpacity="0.45"
              strokeDasharray="3 3"
            />
          )}
          {known && c.isBase && (
            <text x={x * CELL + CELL / 2} y={y * CELL + CELL / 2 + 5} textAnchor="middle" fontSize="15" fill="#7dd3fc">
              ⌂
            </text>
          )}
          {known && c.state === 'blocked' && (
            <g stroke="#f87171" strokeWidth="2" opacity="0.85">
              <line x1={x * CELL + 5} y1={y * CELL + 5} x2={x * CELL + CELL - 5} y2={y * CELL + CELL - 5} />
              <line x1={x * CELL + CELL - 5} y1={y * CELL + 5} x2={x * CELL + 5} y2={y * CELL + CELL - 5} />
            </g>
          )}
          {known && c.state === 'hazard' && (
            <text x={x * CELL + CELL / 2} y={y * CELL + CELL / 2 + 5} textAnchor="middle" fontSize="14" fill="#fb923c">
              ⚠
            </text>
          )}
          {known && c.flashUntil >= state.tick && (
            <rect
              key={`flash-${c.discoveredAt}-${x}-${y}`}
              x={x * CELL}
              y={y * CELL}
              width={CELL}
              height={CELL}
              fill="#3b9eff"
              className="flash-cell pointer-events-none"
            />
          )}
        </g>,
      )
    }
  }

  const survivorNodes = state.survivors.map((sv) => {
    const color = sv.status === 'confirmed' ? '#22c55e' : sv.status === 'rescued' ? '#64748b' : '#f5a524'
    const cx = sv.x * CELL + CELL / 2
    const cy = sv.y * CELL + CELL / 2
    return (
      <g key={sv.id} transform={`translate(${cx}, ${cy})`}>
        {sv.status !== 'rescued' && <circle className="pulse-ring" r="3" fill="none" stroke={color} strokeWidth="2" />}
        <circle r="5.5" fill={color} stroke="#0a0e14" strokeWidth="1.5" />
        <text y="1" textAnchor="middle" fontSize="7" fill="#0a0e14" fontWeight="700">
          +
        </text>
      </g>
    )
  })

  const robotNodes = state.robots.map((r) => {
    const cx = r.x * CELL + CELL / 2
    const cy = r.y * CELL + CELL / 2
    const isSelected = r.id === selectedRobotId
    const ringColor = r.status === 'active' ? '#22c55e' : r.status === 'degraded' ? '#f5a524' : '#ef4444'
    const uncertainty = r.status === 'lost' ? Math.min(6, (state.tick - (r.lostSince ?? state.tick)) * 0.35) : 0

    return (
      <g key={r.id} style={{ cursor: 'pointer' }} onClick={() => onSelectRobot(r.id)}>
        {r.trail.length > 1 && (
          <polyline
            points={r.trail.map((p) => `${p.x * CELL + CELL / 2},${p.y * CELL + CELL / 2}`).join(' ')}
            fill="none"
            stroke={r.color}
            strokeOpacity="0.35"
            strokeWidth="2"
          />
        )}
        {uncertainty > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={uncertainty * CELL}
            fill={ringColor}
            fillOpacity="0.08"
            stroke={ringColor}
            strokeOpacity="0.4"
            strokeDasharray="4 3"
          />
        )}
        {isSelected && <circle cx={cx} cy={cy} r={CELL * 0.62} fill="none" stroke="#e6edf3" strokeWidth="1.5" strokeOpacity="0.6" />}
        <circle cx={cx} cy={cy} r={CELL * 0.42} fill="none" stroke={ringColor} strokeWidth="2" strokeDasharray={r.status === 'active' ? '0' : '3 2'} />
        <g transform={`translate(${cx}, ${cy}) rotate(${(r.heading * 180) / Math.PI})`}>
          <polygon points="7,0 -5,-5 -2,0 -5,5" fill={r.status === 'lost' ? '#475569' : r.color} stroke="#0a0e14" strokeWidth="1" />
        </g>
      </g>
    )
  })

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full select-none"
      style={{ background: '#0a0e14' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {gridCells}
      {survivorNodes}
      {robotNodes}
    </svg>
  )
}
