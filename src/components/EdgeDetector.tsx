import { useEffect, useRef, useState, useCallback } from 'react'
import type { Corners, Point } from '../types'

interface Props {
  rawDataUrl: string
  initialCorners: Corners
  onConfirm: (corners: Corners) => void
  onBack: () => void
  processing?: boolean
}

type Handle = keyof Corners

const HANDLE_RADIUS = 22

export function EdgeDetector({ rawDataUrl, initialCorners, onConfirm, onBack, processing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [corners, setCorners] = useState<Corners>(initialCorners)
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 })
  const [dragging, setDragging] = useState<Handle | null>(null)
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 })

  // Keep corners in sync with initialCorners on prop change
  useEffect(() => {
    setCorners(initialCorners)
  }, [initialCorners])

  useEffect(() => {
    const img = new Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = rawDataUrl
  }, [rawDataUrl])

  // Convert image coordinates to display coordinates
  function toDisplay(pt: Point, displayW: number, displayH: number): Point {
    return {
      x: (pt.x / imgSize.w) * displayW,
      y: (pt.y / imgSize.h) * displayH,
    }
  }

  // Convert display coordinates to image coordinates
  function toImage(pt: Point, displayW: number, displayH: number): Point {
    return {
      x: (pt.x / displayW) * imgSize.w,
      y: (pt.y / displayH) * imgSize.h,
    }
  }

  function getDisplayRect(): { w: number; h: number } {
    const el = containerRef.current
    if (!el) return { w: 300, h: 400 }
    return { w: el.clientWidth, h: el.clientHeight }
  }

  function getEventPos(e: React.PointerEvent | PointerEvent): Point {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = useCallback(
    (handle: Handle) => (e: React.PointerEvent<SVGCircleElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const pos = getEventPos(e)
      const { w, h } = getDisplayRect()
      const displayed = toDisplay(corners[handle], w, h)
      dragOffsetRef.current = { x: pos.x - displayed.x, y: pos.y - displayed.y }
      setDragging(handle)
    },
    [corners, imgSize],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (!dragging) return
      const pos = getEventPos(e)
      const { w, h } = getDisplayRect()
      const displayX = Math.max(0, Math.min(w, pos.x - dragOffsetRef.current.x))
      const displayY = Math.max(0, Math.min(h, pos.y - dragOffsetRef.current.y))
      const imgPt = toImage({ x: displayX, y: displayY }, w, h)
      setCorners(prev => ({ ...prev, [dragging]: imgPt }))
    },
    [dragging, imgSize],
  )

  const onPointerUp = useCallback(() => setDragging(null), [])

  const handles: Handle[] = ['tl', 'tr', 'br', 'bl']
  const { w: dw, h: dh } = getDisplayRect()

  const displayCorners = {
    tl: toDisplay(corners.tl, dw, dh),
    tr: toDisplay(corners.tr, dw, dh),
    br: toDisplay(corners.br, dw, dh),
    bl: toDisplay(corners.bl, dw, dh),
  }

  const polyPoints = `${displayCorners.tl.x},${displayCorners.tl.y} ${displayCorners.tr.x},${displayCorners.tr.y} ${displayCorners.br.x},${displayCorners.br.y} ${displayCorners.bl.x},${displayCorners.bl.y}`

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Image + overlay */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <img
          src={rawDataUrl}
          alt="Captured"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        {/* Dark overlay outside quad */}
        <svg
          className="absolute inset-0 w-full h-full"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Dim everything outside the selection */}
          <defs>
            <mask id="quad-mask">
              <rect width="100%" height="100%" fill="white" />
              <polygon points={polyPoints} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#quad-mask)" />

          {/* Selection outline */}
          <polygon
            points={polyPoints}
            fill="none"
            stroke="#00e676"
            strokeWidth="2"
          />

          {/* Corner handles */}
          {handles.map(key => {
            const pt = displayCorners[key]
            return (
              <g key={key}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={HANDLE_RADIUS}
                  fill="rgba(0,230,118,0.15)"
                  stroke="#00e676"
                  strokeWidth="2"
                  onPointerDown={onPointerDown(key)}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                />
                <circle cx={pt.x} cy={pt.y} r={5} fill="#00e676" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-bg-surface border-t border-bg-elevated">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span className="text-sm">Retake</span>
        </button>

        <p className="text-text-secondary text-xs font-mono">DRAG CORNERS</p>

        <button
          onClick={() => onConfirm(corners)}
          disabled={processing}
          className="bg-accent text-bg-primary font-bold px-5 py-2.5 rounded-xl disabled:opacity-60 flex items-center gap-2"
        >
          {processing ? (
            <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
          ) : null}
          Confirm
        </button>
      </div>
    </div>
  )
}
