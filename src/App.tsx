import { useReducer } from 'react'
import type { AppAction, AppState, ScannedPage, FilterPreset, Corners } from './types'
import { Camera } from './components/Camera'
import { EdgeDetector } from './components/EdgeDetector'
import { FilterPanel } from './components/FilterPanel'
import { PageStrip } from './components/PageStrip'
import { ExportPanel } from './components/ExportPanel'
import { detectCorners, imageDataFromDataUrl } from './utils/edgeDetection'
import { usePerspective } from './hooks/usePerspective'
import { useState } from 'react'

const initial: AppState = {
  step: 'camera',
  pages: [],
  pending: null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CAPTURE':
      return { ...state, step: 'edge', pending: { rawDataUrl: action.rawDataUrl, corners: action.corners, warpedDataUrl: null } }

    case 'UPDATE_CORNERS':
      if (!state.pending) return state
      return { ...state, pending: { ...state.pending, corners: action.corners } }

    case 'CONFIRM_WARP':
      if (!state.pending) return state
      return { ...state, step: 'filter', pending: { ...state.pending, warpedDataUrl: action.warpedDataUrl } }

    case 'ADD_FINAL_PAGE':
      return { ...state, step: 'camera', pages: [...state.pages, action.page], pending: null }

    case 'DELETE_PAGE':
      return { ...state, pages: state.pages.filter(p => p.id !== action.id) }

    case 'MOVE_PAGE': {
      const pages = [...state.pages]
      const [item] = pages.splice(action.from, 1)
      pages.splice(action.to, 0, item)
      return { ...state, pages }
    }

    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'RESET':
      return initial

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const { warp, warping } = usePerspective()
  const [detecting, setDetecting] = useState(false)

  async function handleCapture(rawDataUrl: string) {
    setDetecting(true)
    try {
      const imageData = await imageDataFromDataUrl(rawDataUrl)
      const corners = detectCorners(imageData)
      dispatch({ type: 'CAPTURE', rawDataUrl, corners })
    } finally {
      setDetecting(false)
    }
  }

  async function handleConfirmCorners(corners: Corners) {
    if (!state.pending) return
    const warpedDataUrl = await warp(state.pending.rawDataUrl, corners)
    dispatch({ type: 'CONFIRM_WARP', warpedDataUrl })
  }

  function handleFilterDone(finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) {
    if (!state.pending) return
    const page: ScannedPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      rawDataUrl: state.pending.rawDataUrl,
      warpedDataUrl: state.pending.warpedDataUrl ?? '',
      finalDataUrl,
      corners: state.pending.corners,
      filter,
      brightness,
      contrast,
    }
    dispatch({ type: 'ADD_FINAL_PAGE', page })
    dispatch({ type: 'SET_STEP', step: 'pages' })
  }

  function handleFilterAddPage(finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) {
    if (!state.pending) return
    const page: ScannedPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      rawDataUrl: state.pending.rawDataUrl,
      warpedDataUrl: state.pending.warpedDataUrl ?? '',
      finalDataUrl,
      corners: state.pending.corners,
      filter,
      brightness,
      contrast,
    }
    dispatch({ type: 'ADD_FINAL_PAGE', page })
    // ADD_FINAL_PAGE already resets step to 'camera'
  }

  return (
    <div className="w-full h-full flex flex-col bg-bg-primary overflow-hidden">
      {/* Step indicator (top strip) */}
      {state.step !== 'camera' && (
        <div className="flex items-center justify-center gap-1.5 py-2 bg-bg-surface flex-shrink-0">
          {(['camera', 'edge', 'filter', 'pages', 'export'] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${
                s === state.step
                  ? 'w-6 bg-accent'
                  : i < (['camera', 'edge', 'filter', 'pages', 'export'] as const).indexOf(state.step)
                  ? 'w-2 bg-accent/50'
                  : 'w-2 bg-bg-elevated'
              }`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden fade-in" key={state.step}>
        {detecting && (
          <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
            <div className="bg-bg-surface rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary text-sm font-mono">Detecting edges…</p>
            </div>
          </div>
        )}

        {state.step === 'camera' && (
          <Camera onCapture={handleCapture} />
        )}

        {state.step === 'edge' && state.pending && (
          <EdgeDetector
            rawDataUrl={state.pending.rawDataUrl}
            initialCorners={state.pending.corners}
            onConfirm={handleConfirmCorners}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'camera' })}
            processing={warping}
          />
        )}

        {state.step === 'filter' && state.pending?.warpedDataUrl && (
          <FilterPanel
            warpedDataUrl={state.pending.warpedDataUrl}
            onAddPage={handleFilterAddPage}
            onDone={handleFilterDone}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'edge' })}
            pageCount={state.pages.length}
          />
        )}

        {state.step === 'pages' && (
          <PageStrip
            pages={state.pages}
            onDelete={id => dispatch({ type: 'DELETE_PAGE', id })}
            onMove={(from, to) => dispatch({ type: 'MOVE_PAGE', from, to })}
            onScanMore={() => dispatch({ type: 'SET_STEP', step: 'camera' })}
            onExport={() => dispatch({ type: 'SET_STEP', step: 'export' })}
          />
        )}

        {state.step === 'export' && (
          <ExportPanel
            pages={state.pages}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'pages' })}
            onReset={() => dispatch({ type: 'RESET' })}
          />
        )}
      </div>

      {/* Bottom nav (visible on pages and export) */}
      {(state.step === 'pages' || state.step === 'export') && (
        <nav className="flex-shrink-0 flex bg-bg-surface border-t border-bg-elevated pb-safe">
          {(
            [
              { step: 'camera', label: 'Scan', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
              { step: 'pages', label: 'Pages', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' },
              { step: 'export', label: 'Export', icon: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z' },
            ] as const
          ).map(({ step, label, icon }) => (
            <button
              key={step}
              onClick={() => {
                if (step === 'camera') dispatch({ type: 'SET_STEP', step: 'camera' })
                else dispatch({ type: 'SET_STEP', step })
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                state.step === step ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d={icon} />
              </svg>
              <span className="text-[10px] font-mono">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
