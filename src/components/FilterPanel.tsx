import { useFilters } from '../hooks/useFilters'
import type { FilterPreset } from '../types'

interface Props {
  warpedDataUrl: string
  onAddPage: (finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) => void
  onDone: (finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) => void
  onBack: () => void
  pageCount: number
}

const PRESETS: { id: FilterPreset; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'enhanced', label: 'Enhanced' },
  { id: 'bw', label: 'B&W' },
  { id: 'dark', label: 'Dark' },
]

export function FilterPanel({ warpedDataUrl, onAddPage, onDone, onBack, pageCount }: Props) {
  const { canvasRef, preset, setPreset, brightness, setBrightness, contrast, setContrast, getFinalDataUrl } =
    useFilters(warpedDataUrl)

  function handleAddPage() {
    onAddPage(getFinalDataUrl(), preset, brightness, contrast)
  }

  function handleDone() {
    onDone(getFinalDataUrl(), preset, brightness, contrast)
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-black p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded"
        />
      </div>

      {/* Controls */}
      <div className="bg-bg-surface border-t border-bg-elevated px-4 py-3 space-y-4">
        {/* Filter presets */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                preset === p.id
                  ? 'bg-accent text-bg-primary font-bold'
                  : 'bg-bg-elevated text-text-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>Brightness</span>
              <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>Contrast</span>
              <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={contrast}
              onChange={e => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-safe">
          <button
            onClick={onBack}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>

          <button
            onClick={handleAddPage}
            className="flex-1 bg-bg-elevated text-white font-bold py-3 rounded-xl text-sm"
          >
            + Add page
          </button>

          <button
            onClick={handleDone}
            className="flex-1 bg-accent text-bg-primary font-bold py-3 rounded-xl text-sm"
          >
            {pageCount > 0 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
