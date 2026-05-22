import { useEffect, useRef, useState, useCallback } from 'react'
import type { FilterPreset } from '../types'

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function applyBrightnessContrast(
  data: Uint8ClampedArray,
  brightness: number,
  contrast: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length)
  // contrast factor: https://www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/
  const f = (259 * (contrast + 255)) / (255 * (259 - contrast))
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c]
      out[i + c] = clamp(f * (v - 128) + 128 + brightness)
    }
    out[i + 3] = data[i + 3]
  }
  return out
}

function toGrayscaleData(data: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    const g = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8
    out[i] = out[i + 1] = out[i + 2] = g
    out[i + 3] = data[i + 3]
  }
  return out
}

function sharpen(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  // Unsharp mask kernel: [[0,-1,0],[-1,5,-1],[0,-1,0]]
  const out = new Uint8ClampedArray(data)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const v =
          5 * data[i + c] -
          data[((y - 1) * w + x) * 4 + c] -
          data[((y + 1) * w + x) * 4 + c] -
          data[(y * w + (x - 1)) * 4 + c] -
          data[(y * w + (x + 1)) * 4 + c]
        out[i + c] = clamp(v)
      }
    }
  }
  return out
}

function autoLevels(data: Uint8ClampedArray): Uint8ClampedArray {
  let min = 255, max = 0
  for (let i = 0; i < data.length; i += 4) {
    const v = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (v < min) min = v
    if (v > max) max = v
  }
  if (max === min) return data
  const scale = 255 / (max - min)
  const out = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) out[i + c] = clamp((data[i + c] - min) * scale)
    out[i + 3] = data[i + 3]
  }
  return out
}

function applyPreset(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  preset: FilterPreset,
): Uint8ClampedArray {
  switch (preset) {
    case 'original':
      return data

    case 'enhanced': {
      let d = autoLevels(data)
      d = applyBrightnessContrast(d, 0, 40)
      d = sharpen(d, w, h)
      return d
    }

    case 'bw': {
      let d = toGrayscaleData(data)
      d = applyBrightnessContrast(d, 0, 60)
      // soft threshold: boost whites, darken grays
      const out = new Uint8ClampedArray(d.length)
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i] > 160 ? 255 : d[i] < 80 ? 0 : d[i]
        out[i] = out[i + 1] = out[i + 2] = v
        out[i + 3] = d[i + 3]
      }
      return out
    }

    case 'dark': {
      return applyBrightnessContrast(data, -30, 20)
    }

    default:
      return data
  }
}

export function useFilters(warpedDataUrl: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const srcDataRef = useRef<ImageData | null>(null)
  const [preset, setPreset] = useState<FilterPreset>('original')
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!warpedDataUrl) return
    const img = new Image()
    img.onload = () => {
      const tmp = document.createElement('canvas')
      tmp.width = img.naturalWidth
      tmp.height = img.naturalHeight
      const ctx = tmp.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      srcDataRef.current = ctx.getImageData(0, 0, tmp.width, tmp.height)
      render()
    }
    img.src = warpedDataUrl
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warpedDataUrl])

  const render = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const src = srcDataRef.current
      const canvas = canvasRef.current
      if (!src || !canvas) return

      const { width: w, height: h } = src
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      let d = applyPreset(new Uint8ClampedArray(src.data), w, h, preset)
      if (brightness !== 0 || contrast !== 0) {
        d = applyBrightnessContrast(d, brightness, contrast)
      }
      const out = new ImageData(new Uint8ClampedArray(d.buffer as ArrayBuffer), w, h)
      ctx.putImageData(out, 0, 0)
    })
  }, [preset, brightness, contrast])

  useEffect(() => {
    if (srcDataRef.current) render()
  }, [render])

  const getFinalDataUrl = useCallback((): string => {
    return canvasRef.current?.toDataURL('image/jpeg', 0.92) ?? ''
  }, [])

  return {
    canvasRef,
    preset,
    setPreset,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    getFinalDataUrl,
  }
}
