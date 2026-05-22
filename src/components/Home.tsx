import type { ScannedPage } from '../types'

interface Props {
  pages: ScannedPage[]
  onScan: () => void
  onExport: () => void
  onDelete: (id: string) => void
  onMove: (from: number, to: number) => void
}

export function Home({ pages, onScan, onExport, onDelete, onMove }: Props) {
  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-2xl tracking-tight">Skana</h1>
            <p className="text-text-secondary text-sm font-mono mt-0.5">DOCUMENT SCANNER</p>
          </div>
          {pages.length > 0 && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 bg-bg-elevated px-4 py-2 rounded-xl"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#00e676">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              <span className="text-accent text-sm font-bold">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {pages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center -mt-16">
            {/* Illustration */}
            <div className="relative">
              <div className="w-32 h-40 rounded-2xl bg-bg-surface border-2 border-bg-elevated flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-1.5 rounded-full bg-bg-elevated" />
                <div className="w-12 h-1.5 rounded-full bg-bg-elevated" />
                <div className="w-14 h-1.5 rounded-full bg-bg-elevated" />
                <div className="w-10 h-1.5 rounded-full bg-bg-elevated" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f0f0f">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-white font-bold text-xl mb-2">No scans yet</p>
              <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                Tap <span className="text-accent font-bold">Scan</span> below to capture your first document. Corners are detected automatically.
              </p>
            </div>

            {/* Tips */}
            <div className="w-full bg-bg-surface rounded-2xl p-4 space-y-3 text-left">
              {[
                { icon: '📷', text: 'Point at any flat document' },
                { icon: '✂️', text: 'Drag corners to trim perfectly' },
                { icon: '🎨', text: 'Apply filters for clean output' },
                { icon: '📤', text: 'Export as PDF or share to WhatsApp' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-text-secondary text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Pages grid */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-secondary text-sm font-mono uppercase tracking-wider">
                {pages.length} Page{pages.length !== 1 ? 's' : ''} scanned
              </p>
              <button
                onClick={onScan}
                className="text-accent text-sm font-bold"
              >
                + Add page
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="relative rounded-2xl overflow-hidden bg-bg-surface"
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={page.finalDataUrl}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay info bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-mono">Page {index + 1}</span>
                      <span className="text-text-secondary text-[10px] font-mono uppercase">
                        {page.filter}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDelete(page.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label={`Delete page ${index + 1}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>

                  {/* Page number badge */}
                  <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-white text-[10px] font-mono font-bold">{index + 1}</span>
                  </div>

                  {/* Reorder arrows */}
                  {pages.length > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1 pointer-events-none">
                      {index > 0 ? (
                        <button
                          onClick={() => onMove(index, index - 1)}
                          className="pointer-events-auto w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                          </svg>
                        </button>
                      ) : <div />}
                      {index < pages.length - 1 ? (
                        <button
                          onClick={() => onMove(index, index + 1)}
                          className="pointer-events-auto w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                          </svg>
                        </button>
                      ) : <div />}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Export CTA at bottom of list */}
            {pages.length > 0 && (
              <button
                onClick={onExport}
                className="w-full mt-4 bg-bg-surface border border-bg-elevated text-text-secondary py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Export all pages
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Scan button */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-safe pb-8 pointer-events-none">
        <button
          onClick={onScan}
          className="pointer-events-auto flex items-center gap-3 bg-accent text-bg-primary font-bold px-8 py-4 rounded-full shadow-2xl active:scale-95 transition-transform"
          style={{ boxShadow: '0 0 40px rgba(0,230,118,0.3)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          Scan Document
        </button>
      </div>
    </div>
  )
}
