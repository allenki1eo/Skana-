import { useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

interface Props {
  onCapture: (dataUrl: string) => void
  onBack?: () => void
}

export function Camera({ onCapture, onBack }: Props) {
  const { videoRef, error, ready, capture, flip } = useCamera()
  const [flashing, setFlashing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCapture() {
    const dataUrl = capture()
    if (!dataUrl) return
    setFlashing(true)
    setTimeout(() => setFlashing(false), 200)
    onCapture(dataUrl)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) onCapture(ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (error === 'permission') {
    return (
      <div className="flex flex-col h-full">
        {onBack && (
          <div className="px-4 pt-safe pt-4">
            <button onClick={onBack} className="text-text-secondary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="currentColor" />
          </svg>
          <div>
            <p className="text-white font-bold text-lg mb-2">Camera access denied</p>
            <p className="text-text-secondary text-sm">Allow camera access in your browser settings, or upload an image instead.</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-accent text-bg-primary font-bold px-6 py-3 rounded-xl"
          >
            Upload image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    )
  }

  if (error === 'notfound') {
    return (
      <div className="flex flex-col h-full">
        {onBack && (
          <div className="px-4 pt-safe pt-4">
            <button onClick={onBack} className="text-text-secondary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor" />
          </svg>
          <div>
            <p className="text-white font-bold text-lg mb-2">No camera found</p>
            <p className="text-text-secondary text-sm">Upload a photo to scan it.</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-accent text-bg-primary font-bold px-6 py-3 rounded-xl"
          >
            Upload image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Corner bracket overlays */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[
          [10, 10, 'h10 v0 M10,10 v10'],
          [90, 10, 'h-10 v0 M90,10 v10'],
          [10, 90, 'h10 v0 M10,90 v-10'],
          [90, 90, 'h-10 v0 M90,90 v-10'],
        ].map(([x, y, d], i) => (
          <path
            key={i}
            d={`M${x},${y} ${d}`}
            stroke="#00e676"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Shutter flash */}
      {flashing && (
        <div className="absolute inset-0 bg-white shutter-flash pointer-events-none" />
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 pt-safe">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        ) : (
          <div className="font-mono text-accent text-sm tracking-widest">SKANA</div>
        )}
        <button
          onClick={flip}
          className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center"
          aria-label="Flip camera"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 11V8l5 4-5 4z" />
          </svg>
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center pb-8 pb-safe">
        <button
          onClick={handleCapture}
          disabled={!ready}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Capture"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
      </div>

      {/* Upload fallback */}
      <button
        onClick={() => fileRef.current?.click()}
        className="absolute bottom-12 right-6 text-xs text-text-secondary font-mono"
        aria-label="Upload from gallery"
      >
        gallery
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
