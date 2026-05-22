import { useReducer, useState } from 'react'
import type { AppAction, AppState, ScannedPage, FilterPreset, Corners } from './types'
import { Home } from './components/Home'
import { Camera } from './components/Camera'
import { EdgeDetector } from './components/EdgeDetector'
import { FilterPanel } from './components/FilterPanel'
import { ExportPanel } from './components/ExportPanel'
import { detectCorners, imageDataFromDataUrl } from './utils/edgeDetection'
import { usePerspective } from './hooks/usePerspective'

const initial: AppState = {
  step: 'home',
  pages: [],
  pending: null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CAPTURE':
      return {
        ...state,
        step: 'edge',
        pending: { rawDataUrl: action.rawDataUrl, corners: action.corners, warpedDataUrl: null },
      }

    case 'UPDATE_CORNERS':
      if (!state.pending) return state
      return { ...state, pending: { ...state.pending, corners: action.corners } }

    case 'CONFIRM_WARP':
      if (!state.pending) return state
      return { ...state, step: 'filter', pending: { ...state.pending, warpedDataUrl: action.warpedDataUrl } }

    case 'ADD_FINAL_PAGE':
      return { ...state, step: 'home', pages: [...state.pages, action.page], pending: null }

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

const SCAN_STEPS = ['edge', 'filter'] as const

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

  function buildPage(
    finalDataUrl: string,
    filter: FilterPreset,
    brightness: number,
    contrast: number,
  ): ScannedPage {
    return {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      rawDataUrl: state.pending!.rawDataUrl,
      warpedDataUrl: state.pending!.warpedDataUrl ?? '',
      finalDataUrl,
      corners: state.pending!.corners,
      filter,
      brightness,
      contrast,
    }
  }

  function handleFilterDone(
    finalDataUrl: string,
    filter: FilterPreset,
    brightness: number,
    contrast: number,
  ) {
    if (!state.pending) return
    dispatch({ type: 'ADD_FINAL_PAGE', page: buildPage(finalDataUrl, filter, brightness, contrast) })
    // ADD_FINAL_PAGE → step: 'home' (shows the saved page immediately)
  }

  function handleFilterAddPage(
    finalDataUrl: string,
    filter: FilterPreset,
    brightness: number,
    contrast: number,
  ) {
    if (!state.pending) return
    dispatch({ type: 'ADD_FINAL_PAGE', page: buildPage(finalDataUrl, filter, brightness, contrast) })
    // Go back to camera to add another
    dispatch({ type: 'SET_STEP', step: 'camera' })
  }

  const inScanFlow = SCAN_STEPS.includes(state.step as (typeof SCAN_STEPS)[number])

  return (
    <div className="relative w-full h-full flex flex-col bg-bg-primary overflow-hidden">

      {/* Scan progress bar — shown only mid-scan */}
      {inScanFlow && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border-b border-bg-elevated flex-shrink-0">
          <button
            onClick={() => dispatch({ type: 'SET_STEP', step: 'home' })}
            className="text-text-secondary mr-1"
            aria-label="Cancel scan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
          <div className="flex gap-1.5 flex-1">
            {SCAN_STEPS.map(s => (
              <div
                key={s}
                className={`h-1 rounded-full flex-1 transition-all ${
                  s === state.step ? 'bg-accent' : 'bg-bg-elevated'
                }`}
              />
            ))}
          </div>
          <span className="text-text-secondary text-xs font-mono w-16 text-right">
            {state.step === 'edge' ? 'ADJUST' : 'FILTER'}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden fade-in" key={state.step}>

        {/* Edge-detection loading overlay */}
        {detecting && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="bg-bg-surface rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm font-bold">Analyzing image…</p>
              <p className="text-text-secondary text-xs font-mono">Detecting document edges</p>
            </div>
          </div>
        )}

        {state.step === 'home' && (
          <Home
            pages={state.pages}
            onScan={() => dispatch({ type: 'SET_STEP', step: 'camera' })}
            onExport={() => dispatch({ type: 'SET_STEP', step: 'export' })}
            onDelete={id => dispatch({ type: 'DELETE_PAGE', id })}
            onMove={(from, to) => dispatch({ type: 'MOVE_PAGE', from, to })}
          />
        )}

        {state.step === 'camera' && (
          <Camera
            onCapture={handleCapture}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'home' })}
          />
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

        {state.step === 'export' && (
          <ExportPanel
            pages={state.pages}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'home' })}
            onReset={() => dispatch({ type: 'RESET' })}
          />
        )}
      </div>
    </div>
  )
}
