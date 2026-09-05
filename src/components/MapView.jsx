import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { COLS, ROWS, gridToLatLng, latLngToGrid } from '../sim/engine'

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const LINK_COLOR = { online: '#2dd4bf', degraded: '#f5b342', autonomous: '#ef4444' }

function RobotGlyph({ color, link, activity, selected }) {
  const ring = LINK_COLOR[link] ?? color
  const pulsing = activity === 'survivor_detected' || activity === 'investigating'
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.55))' }}>
      {selected && (
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="#f8fafc" strokeWidth="1.4" strokeOpacity="0.9" className="fade-in" />
      )}
      {pulsing && <circle className="pulse-ring" cx="16" cy="16" r="9" fill="none" stroke={ring} strokeWidth="2" />}
      <circle
        cx="16"
        cy="16"
        r="9"
        fill={link === 'autonomous' ? '#3a4556' : '#0b1220'}
        stroke={ring}
        strokeWidth="2.5"
        strokeDasharray={link === 'online' ? undefined : '3 2'}
      />
      <circle cx="16" cy="16" r="4" fill={color} />
    </svg>
  )
}

function SurvivorPin({ status }) {
  const color = status === 'confirmed' ? '#34d399' : status === 'rescued' ? '#64748b' : '#fbbf24'
  return (
    <svg width="24" height="32" viewBox="0 0 24 32">
      {status === 'unconfirmed' && (
        <circle className="pulse-ring" cx="12" cy="11.5" r="6" fill="none" stroke={color} strokeWidth="2" />
      )}
      <path
        d="M12 1C6.2 1 1.5 5.6 1.5 11.3c0 7.8 10.5 19 10.5 19s10.5-11.2 10.5-19C22.5 5.6 17.8 1 12 1z"
        fill={color}
        stroke="#0b1220"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11.5" r="3.6" fill="#0b1220" />
    </svg>
  )
}

function HazardBadge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <polygon points="12,2 22,20 2,20" fill="#f97316" stroke="#0b1220" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="11" y="9" width="2" height="6" fill="#0b1220" />
      <rect x="11" y="16" width="2" height="2" fill="#0b1220" />
    </svg>
  )
}

function BlockedBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#ef4444" stroke="#0b1220" strokeWidth="1.5" />
      <rect x="4" y="9.5" width="14" height="3" rx="1" fill="#0b1220" />
    </svg>
  )
}

function BaseBadge() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <rect x="3" y="3" width="22" height="22" rx="5" fill="#0b1220" stroke="#2dd4bf" strokeWidth="2" />
      <path d="M14 8l7 6h-2v6h-4v-4h-2v4H9v-6H7z" fill="#2dd4bf" />
    </svg>
  )
}

const MapView = forwardRef(function MapView(
  { state, selectedRobotId, onSelectRobot, onCellClick, interactive, showComms },
  ref,
) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const fogCanvasRef = useRef(null)
  const [, bump] = useState(0)
  const forceRedraw = useCallback(() => bump((n) => n + 1), [])

  useEffect(() => {
    const center = gridToLatLng(COLS / 2, ROWS / 2)
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 14,
      maxZoom: 19,
    }).setView([center.lat, center.lng], 16)
    map.zoomControl.setPosition('topright')

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)

    let raf = null
    const onViewChange = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        forceRedraw()
      })
    }
    map.on('move zoom resize', onViewChange)
    mapRef.current = map
    map.invalidateSize()
    forceRedraw()

    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.off('move zoom resize', onViewChange)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Click handling is rebound whenever interactivity/handlers change, so a
  // replay session (interactive=false) can't issue live orders.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handler = (e) => {
      if (!interactive) return
      const { x, y } = latLngToGrid(e.latlng.lat, e.latlng.lng)
      onCellClick(x, y)
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [interactive, onCellClick])

  useImperativeHandle(
    ref,
    () => ({
      flyTo(x, y) {
        const map = mapRef.current
        if (!map) return
        const { lat, lng } = gridToLatLng(x, y)
        map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.9 })
      },
      shake() {
        const el = containerRef.current
        if (!el) return
        el.classList.remove('quake-shake')
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth
        el.classList.add('quake-shake')
      },
    }),
    [],
  )

  const project = useCallback((x, y) => {
    const map = mapRef.current
    if (!map) return null
    const { lat, lng } = gridToLatLng(x, y)
    return map.latLngToContainerPoint([lat, lng])
  }, [])

  // Redraw the fog-of-war layer, anchored in real lat/lng so it stays
  // correctly placed while panning/zooming. Verified cells are fully clear;
  // scanned-but-unconfirmed cells keep a light haze — the map communicates
  // confidence, not just presence/absence of data.
  useEffect(() => {
    const canvas = fogCanvasRef.current
    const map = mapRef.current
    if (!canvas || !map) return
    const container = map.getContainer()
    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(5, 10, 18, 0.72)'
    ctx.fillRect(0, 0, w, h)

    const p0 = project(0, 0)
    const p1 = project(1, 0)
    const cellPx = p0 && p1 ? Math.hypot(p1.x - p0.x, p1.y - p0.y) : 40
    const radius = cellPx * 1.05

    ctx.globalCompositeOperation = 'destination-out'
    for (const k in state.cells) {
      const c = state.cells[k]
      const pt = project(c.x, c.y)
      if (!pt) continue
      if (pt.x < -radius || pt.x > w + radius || pt.y < -radius || pt.y > h + radius) continue
      const strength = c.tier === 'verified' ? 1 : 0.55
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius)
      grad.addColorStop(0, `rgba(0,0,0,${strength})`)
      grad.addColorStop(0.72, `rgba(0,0,0,${strength})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'

    if (showComms) {
      for (const z of state.deadZones) {
        const pt = project(z.x, z.y)
        if (!pt) continue
        const rr = z.r * cellPx
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, rr)
        grad.addColorStop(0, 'rgba(239,68,68,0.28)')
        grad.addColorStop(1, 'rgba(239,68,68,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, rr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cells, state.deadZones, showComms, project])

  const cellPxNow = (() => {
    const p0 = project(0, 0)
    const p1 = project(1, 0)
    return p0 && p1 ? Math.hypot(p1.x - p0.x, p1.y - p0.y) : 40
  })()

  const baseCell = Object.values(state.cells).find((c) => c.isBase)
  const basePt = baseCell ? project(baseCell.x, baseCell.y) : null

  const hazardMarkers = []
  const blockedMarkers = []
  for (const k in state.cells) {
    const c = state.cells[k]
    if (c.state !== 'hazard' && c.state !== 'blocked') continue
    const pt = project(c.x, c.y)
    if (!pt) continue
    ;(c.state === 'hazard' ? hazardMarkers : blockedMarkers).push({ key: k, pt })
  }

  const containerBox = mapRef.current ? mapRef.current.getContainer() : null
  const boxW = containerBox ? containerBox.clientWidth : 0
  const boxH = containerBox ? containerBox.clientHeight : 0

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" style={{ isolation: 'isolate' }} />
      <canvas ref={fogCanvasRef} className="absolute inset-0 pointer-events-none" />

      <svg className="absolute inset-0 pointer-events-none" width={boxW} height={boxH}>
        {state.robots.map((r) => {
          if (r.trail.length < 2) return null
          const pts = [...r.trail, { x: r.x, y: r.y }].map((p) => project(p.x, p.y)).filter(Boolean)
          if (pts.length < 2) return null
          return (
            <polyline
              key={`trail-${r.id}`}
              points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={r.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
          )
        })}

        {state.robots
          .filter((r) => r.routePath && r.routePath.length > 1)
          .map((r) => {
            const pts = r.routePath.map((p) => project(p.x, p.y)).filter(Boolean)
            if (pts.length < 2) return null
            return (
              <polyline
                key={r.id}
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={r.color}
                strokeWidth="2.5"
                strokeDasharray="7 6"
                strokeLinecap="round"
                className="route-line"
                opacity="0.85"
              />
            )
          })}

        {Object.values(state.cells)
          .filter((c) => c.flashUntil >= state.tick && (c.state === 'hazard' || c.state === 'blocked'))
          .map((c) => {
            const pt = project(c.x, c.y)
            if (!pt) return null
            return (
              <circle
                key={`ping-${c.x}-${c.y}-${c.discoveredAt}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="none"
                stroke={c.state === 'hazard' ? '#f97316' : '#ef4444'}
                strokeWidth="2"
                className="discovery-ping"
              />
            )
          })}
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        {basePt && (
          <div className="absolute" style={{ left: basePt.x, top: basePt.y, transform: 'translate(-50%,-50%)' }}>
            <BaseBadge />
          </div>
        )}

        {blockedMarkers.map((m) => (
          <div key={m.key} className="absolute" style={{ left: m.pt.x, top: m.pt.y, transform: 'translate(-50%,-50%)' }}>
            <BlockedBadge />
          </div>
        ))}

        {hazardMarkers.map((m) => (
          <div key={m.key} className="absolute" style={{ left: m.pt.x, top: m.pt.y, transform: 'translate(-50%,-50%)' }}>
            <HazardBadge />
          </div>
        ))}

        {state.survivors.map((sv) => {
          const pt = project(sv.x, sv.y)
          if (!pt) return null
          return (
            <div
              key={sv.id}
              className="absolute pointer-events-none"
              style={{ left: pt.x, top: pt.y, transform: 'translate(-50%,-100%)' }}
              title={`Survivor · ${sv.status}`}
            >
              <SurvivorPin status={sv.status} />
            </div>
          )
        })}

        {state.robots.map((r) => {
          const pt = project(r.x, r.y)
          if (!pt) return null
          const ageTicks = r.link === 'autonomous' ? state.tick - (r.autonomousSince ?? state.tick) : 0
          const uncertaintyPx = Math.min(cellPxNow * 2.2, ageTicks * cellPxNow * 0.09)
          return (
            <div
              key={r.id}
              className="absolute pointer-events-auto"
              style={{ left: pt.x, top: pt.y, transition: 'left 0.9s linear, top 0.9s linear' }}
            >
              {uncertaintyPx > 4 && (
                <div
                  className="absolute rounded-full border-2 border-dashed"
                  style={{
                    width: uncertaintyPx * 2,
                    height: uncertaintyPx * 2,
                    left: -uncertaintyPx,
                    top: -uncertaintyPx,
                    borderColor: '#ef444466',
                    background: '#ef44440a',
                    borderWidth: 1,
                  }}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectRobot(r.id)
                }}
                className="cursor-pointer"
                style={{ transform: 'translate(-16px,-16px)' }}
                title={r.name}
              >
                <RobotGlyph color={r.color} link={r.link} activity={r.activity} selected={r.id === selectedRobotId} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default MapView
