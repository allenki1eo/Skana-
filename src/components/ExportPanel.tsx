import { useState } from 'react'
import type { ScannedPage } from '../types'
import { exportPDF, exportZip, exportSingleImage, shareToWhatsApp } from '../utils/exportUtils'

interface Props {
  pages: ScannedPage[]
  onBack: () => void
  onReset: () => void
}

export function ExportPanel({ pages, onBack, onReset }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<void>) {
    setLoading(key)
    try {
      await fn()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-4">
        <button onClick={onBack} className="text-text-secondary" aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-xl">Export</h1>
      </div>

      {/* Preview strip */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {pages.map((page, i) => (
            <div key={page.id} className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-bg-surface relative">
              <img src={page.finalDataUrl} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] font-mono px-1 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-xs font-mono mt-2">
          {pages.length} PAGE{pages.length !== 1 ? 'S' : ''} READY
        </p>
      </div>

      {/* Export options */}
      <div className="flex-1 px-4 space-y-3">
        {/* PDF */}
        <button
          onClick={() => run('pdf', () => exportPDF(pages))}
          disabled={!!loading}
          className="w-full flex items-center gap-4 bg-bg-surface rounded-xl p-4 active:bg-bg-elevated disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
            {loading === 'pdf' ? (
              <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff5252">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-bold">Download PDF</p>
            <p className="text-text-secondary text-sm">All {pages.length} pages in one file</p>
          </div>
        </button>

        {/* ZIP images */}
        {pages.length > 1 ? (
          <button
            onClick={() => run('zip', () => exportZip(pages))}
            disabled={!!loading}
            className="w-full flex items-center gap-4 bg-bg-surface rounded-xl p-4 active:bg-bg-elevated disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
              {loading === 'zip' ? (
                <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#00e676">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Download ZIP</p>
              <p className="text-text-secondary text-sm">Individual JPEG images</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => run('img', async () => exportSingleImage(pages[0]))}
            disabled={!!loading}
            className="w-full flex items-center gap-4 bg-bg-surface rounded-xl p-4 active:bg-bg-elevated disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#00e676">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Download Image</p>
              <p className="text-text-secondary text-sm">Save as JPEG</p>
            </div>
          </button>
        )}

        {/* WhatsApp Share */}
        <button
          onClick={() => run('share', () => shareToWhatsApp(pages))}
          disabled={!!loading}
          className="w-full flex items-center gap-4 bg-bg-surface rounded-xl p-4 active:bg-bg-elevated disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
            {loading === 'share' ? (
              <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-bold">Share to WhatsApp</p>
            <p className="text-text-secondary text-sm">Send via WhatsApp</p>
          </div>
        </button>
      </div>

      {/* New scan CTA */}
      <div className="px-4 pb-safe pb-5 pt-4 border-t border-bg-elevated mt-4">
        <button
          onClick={onReset}
          className="w-full border border-bg-elevated text-text-secondary py-3 rounded-xl text-sm"
        >
          Start new scan
        </button>
      </div>
    </div>
  )
}
