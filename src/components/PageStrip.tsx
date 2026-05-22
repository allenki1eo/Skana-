import type { ScannedPage } from '../types'

interface Props {
  pages: ScannedPage[]
  onDelete: (id: string) => void
  onMove: (from: number, to: number) => void
  onScanMore: () => void
  onExport: () => void
}

export function PageStrip({ pages, onDelete, onMove, onScanMore, onExport }: Props) {
  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3">
        <h1 className="text-white font-bold text-xl">
          Pages <span className="text-text-secondary font-mono text-base ml-1">{pages.length}</span>
        </h1>
        <button
          onClick={onScanMore}
          className="text-accent font-bold text-sm"
        >
          + Scan more
        </button>
      </div>

      {/* Page grid */}
      {pages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-bg-elevated">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="currentColor" />
          </svg>
          <p className="text-text-secondary">No pages yet. Scan a document to get started.</p>
          <button
            onClick={onScanMore}
            className="bg-accent text-bg-primary font-bold px-6 py-3 rounded-xl"
          >
            Scan a document
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {pages.map((page, index) => (
              <div key={page.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-bg-surface">
                <img
                  src={page.finalDataUrl}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Page number badge */}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs font-mono px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDelete(page.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger flex items-center justify-center"
                  aria-label={`Delete page ${index + 1}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>

                {/* Move left/right */}
                {pages.length > 1 && (
                  <>
                    {index > 0 && (
                      <button
                        onClick={() => onMove(index, index - 1)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 flex items-center justify-center"
                        aria-label="Move left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                        </svg>
                      </button>
                    )}
                    {index < pages.length - 1 && (
                      <button
                        onClick={() => onMove(index, index + 1)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 flex items-center justify-center"
                        aria-label="Move right"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export CTA */}
      {pages.length > 0 && (
        <div className="px-4 pb-safe pb-5 pt-3 border-t border-bg-elevated">
          <button
            onClick={onExport}
            className="w-full bg-accent text-bg-primary font-bold py-4 rounded-xl text-base"
          >
            Export {pages.length} page{pages.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
