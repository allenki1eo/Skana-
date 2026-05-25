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

type ProcessingStatus = null | 'detecting' | 'warping'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const { warp } = usePerspective()
  const [processing, setProcessing] = useState<ProcessingStatus>(null)

  // Auto-detect edges + warp in one step — skip EdgeDetector entirely
  async function handleCapture(rawDataUrl: string) {
    setProcessing('detecting')
    let corners: Corners
    try {
      const imageData = await imageDataFromDataUrl(rawDataUrl)
      corners = detectCorners(imageData)
    } finally {
      setProcessing(null)
    }

    // Store raw + corners first so EdgeDetector can use them if user hits Re-crop
    dispatch({ type: 'CAPTURE', rawDataUrl, corners })

    // Auto-warp immediately
    setProcessing('warping')
    try {
      const warpedDataUrl = await warp(rawDataUrl, corners)
      dispatch({ type: 'CONFIRM_WARP', warpedDataUrl })
    } finally {
      setProcessing(null)
    }
  }

  async function handleConfirmCorners(corners: Corners) {
    if (!state.pending) return
    setProcessing('warping')
    try {
      const warpedDataUrl = await warp(state.pending.rawDataUrl, corners)
      dispatch({ type: 'CONFIRM_WARP', warpedDataUrl })
    } finally {
      setProcessing(null)
    }
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

  function handleFilterDone(finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) {
    if (!state.pending) return
    dispatch({ type: 'ADD_FINAL_PAGE', page: buildPage(finalDataUrl, filter, brightness, contrast) })
  }

  function handleFilterAddPage(finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) {
    if (!state.pending) return
    dispatch({ type: 'ADD_FINAL_PAGE', page: buildPage(finalDataUrl, filter, brightness, contrast) })
    dispatch({ type: 'SET_STEP', step: 'camera' })
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-bg-primary overflow-hidden">

      {/* ── Full-screen processing overlay ── */}
      {processing && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-accent/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">
              {processing === 'detecting' ? 'Detecting edges…' : 'Correcting perspective…'}
            </p>
            <p className="text-text-secondary text-sm font-mono mt-1">
              {processing === 'detecting' ? 'Finding document corners' : 'Straightening your scan'}
            </p>
          </div>
        </div>
      )}

      {/* ── Step content ── */}
      <div className="flex-1 overflow-hidden fade-in" key={state.step}>

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

        {/* EdgeDetector only reachable via "Re-crop" from FilterPanel */}
        {state.step === 'edge' && state.pending && (
          <EdgeDetector
            rawDataUrl={state.pending.rawDataUrl}
            initialCorners={state.pending.corners}
            onConfirm={handleConfirmCorners}
            onBack={() => dispatch({ type: 'SET_STEP', step: 'filter' })}
            processing={processing === 'warping'}
          />
        )}

        {state.step === 'filter' && state.pending?.warpedDataUrl && (
          <FilterPanel
            warpedDataUrl={state.pending.warpedDataUrl}
            onAddPage={handleFilterAddPage}
            onDone={handleFilterDone}
            onRecrop={() => dispatch({ type: 'SET_STEP', step: 'edge' })}
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
