import { useFilters } from '../hooks/useFilters'
import type { FilterPreset } from '../types'

interface Props {
  warpedDataUrl: string
  onAddPage: (finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) => void
  onDone: (finalDataUrl: string, filter: FilterPreset, brightness: number, contrast: number) => void
  onRecrop: () => void
  pageCount: number
}

const PRESETS: { id: FilterPreset; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'enhanced', label: 'Enhanced' },
  { id: 'bw', label: 'B&W' },
  { id: 'dark', label: 'Dark' },
]

export function FilterPanel({ warpedDataUrl, onAddPage, onDone, onRecrop, pageCount }: Props) {
  const { canvasRef, preset, setPreset, brightness, setBrightness, contrast, setContrast, getFinalDataUrl } =
    useFilters(warpedDataUrl)

  return (
    <div className="flex flex-col h-full bg-bg-primary">

      {/* Preview */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

        {/* Re-crop chip — top-right of preview */}
        <button
          onClick={onRecrop}
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 border border-white/20 text-white text-xs font-mono px-3 py-1.5 rounded-full backdrop-blur-sm"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
          </svg>
          Re-crop
        </button>
      </div>

      {/* Controls */}
      <div className="bg-bg-surface border-t border-bg-elevated px-4 pt-3 pb-safe space-y-3">

        {/* Filter presets */}
        <div className="flex gap-2 overflow-x-auto">
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
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>Brightness</span>
              <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
            </div>
            <input type="range" min={-100} max={100} value={brightness}
              onChange={e => setBrightness(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>Contrast</span>
              <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
            </div>
            <input type="range" min={-100} max={100} value={contrast}
              onChange={e => setContrast(Number(e.target.value))} className="w-full" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onAddPage(getFinalDataUrl(), preset, brightness, contrast)}
            className="flex-1 bg-bg-elevated text-white font-bold py-3.5 rounded-xl text-sm"
          >
            + Add page
          </button>
          <button
            onClick={() => onDone(getFinalDataUrl(), preset, brightness, contrast)}
            className="flex-1 bg-accent text-bg-primary font-bold py-3.5 rounded-xl text-sm"
          >
            {pageCount > 0 ? 'Save & done' : 'Save page'}
          </button>
        </div>
      </div>
    </div>
  )
}
