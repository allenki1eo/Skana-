import type { ScannedPage } from '../types'

interface Props {
  pages: ScannedPage[]
  onScan: () => void
  onExport: () => void
  onDelete: (id: string) => void
  onMove: (from: number, to: number) => void
}

export function Home({ pages, onScan, onExport, onDelete, onMove }: Props) {
  const hasPages = pages.length > 0

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-safe pt-5 pb-3">
        <div>
          <span className="text-accent font-mono text-xs tracking-[0.2em]">SKANA</span>
          <h1 className="text-white font-bold text-2xl leading-tight">
            {hasPages ? 'Your scans' : 'Document\nScanner'}
          </h1>
        </div>
        {hasPages && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-4 py-2 rounded-full"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#00e676">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            <span className="text-accent text-sm font-bold">Export</span>
          </button>
        )}
      </div>

      {/* ── Main area ── */}
      {!hasPages ? (

        /* ── Empty state: big centered scan CTA ── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

          {/* Big scan button */}
          <button
            onClick={onScan}
            className="relative flex flex-col items-center justify-center w-52 h-52 rounded-[3rem] bg-bg-surface border-2 border-dashed border-accent/40 active:scale-95 transition-transform gap-4"
            style={{ boxShadow: '0 0 60px rgba(0,230,118,0.08)' }}
          >
            {/* Animated ring */}
            <span className="absolute inset-0 rounded-[3rem] border-2 border-accent/20 animate-ping" style={{ animationDuration: '2s' }} />

            <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="#00e676">
                <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-white font-bold text-lg leading-tight">Tap to Scan</p>
              <p className="text-text-secondary text-xs mt-0.5">Auto edge detection</p>
            </div>
          </button>

          {/* How it works */}
          <div className="w-full bg-bg-surface rounded-2xl divide-y divide-bg-elevated">
            {[
              { step: '1', text: 'Point camera at a document' },
              { step: '2', text: 'Edges detected automatically' },
              { step: '3', text: 'Pick a filter, then export' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4 px-4 py-3.5">
                <span className="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                  {step}
                </span>
                <span className="text-text-secondary text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

      ) : (

        /* ── Pages grid ── */
        <div className="flex-1 overflow-y-auto px-5 pb-32">
          <p className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-3">
            {pages.length} page{pages.length !== 1 ? 's' : ''} · tap export to save
          </p>

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

                {/* Gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-mono font-bold">Pg {index + 1}</span>
                    <span className="text-text-secondary text-[10px] font-mono uppercase">{page.filter}</span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => onDelete(page.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>

                {/* Page badge */}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                  <span className="text-white text-[10px] font-mono font-bold">{index + 1}</span>
                </div>

                {/* Reorder */}
                {pages.length > 1 && (
                  <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 flex justify-between px-1">
                    {index > 0 ? (
                      <button onClick={() => onMove(index, index - 1)} className="w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" /></svg>
                      </button>
                    ) : <div />}
                    {index < pages.length - 1 ? (
                      <button onClick={() => onMove(index, index + 1)} className="w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
                      </button>
                    ) : <div />}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={onExport}
            className="w-full mt-4 bg-bg-surface border border-bg-elevated text-text-secondary py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Export {pages.length} page{pages.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* ── Floating Scan button (when pages exist) ── */}
      {hasPages && (
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-safe pb-7 pointer-events-none">
          <button
            onClick={onScan}
            className="pointer-events-auto flex items-center gap-3 bg-accent text-bg-primary font-bold px-7 py-4 rounded-full active:scale-95 transition-transform"
            style={{ boxShadow: '0 0 40px rgba(0,230,118,0.35)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            Scan another
          </button>
        </div>
      )}
    </div>
  )
}
