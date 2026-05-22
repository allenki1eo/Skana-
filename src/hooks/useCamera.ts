import { useEffect, useRef, useState, useCallback } from 'react'

type CameraError = 'permission' | 'notfound' | null

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<CameraError>(null)
  const [ready, setReady] = useState(false)
  const facingRef = useRef<'environment' | 'user'>('environment')

  const startStream = useCallback(async (facingMode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setReady(false)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.name === 'NotAllowedError') setError('permission')
        else setError('notfound')
      } else {
        setError('notfound')
      }
    }
  }, [])

  useEffect(() => {
    startStream('environment')
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [startStream])

  const capture = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.95)
  }, [])

  const flip = useCallback(() => {
    const next = facingRef.current === 'environment' ? 'user' : 'environment'
    facingRef.current = next
    startStream(next)
  }, [startStream])

  return { videoRef, error, ready, capture, flip }
}
