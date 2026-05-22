import type { Corners, Point } from '../types'

function toGrayscale(data: Uint8ClampedArray, len: number): Uint8ClampedArray {
  const gray = new Uint8ClampedArray(len)
  for (let i = 0; i < len; i++) {
    gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8
  }
  return gray
}

function gaussianBlur3x3(gray: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(gray.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const sum =
        gray[(y - 1) * w + (x - 1)] +
        2 * gray[(y - 1) * w + x] +
        gray[(y - 1) * w + (x + 1)] +
        2 * gray[y * w + (x - 1)] +
        4 * gray[y * w + x] +
        2 * gray[y * w + (x + 1)] +
        gray[(y + 1) * w + (x - 1)] +
        2 * gray[(y + 1) * w + x] +
        gray[(y + 1) * w + (x + 1)]
      out[y * w + x] = sum >> 4
    }
  }
  return out
}

function sobelEdges(gray: Uint8ClampedArray, w: number, h: number, threshold: number): Uint8ClampedArray {
  const edges = new Uint8ClampedArray(gray.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y - 1) * w + (x - 1)] +
        gray[(y - 1) * w + (x + 1)] +
        -2 * gray[y * w + (x - 1)] +
        2 * gray[y * w + (x + 1)] +
        -gray[(y + 1) * w + (x - 1)] +
        gray[(y + 1) * w + (x + 1)]
      const gy =
        -gray[(y - 1) * w + (x - 1)] -
        2 * gray[(y - 1) * w + x] -
        gray[(y - 1) * w + (x + 1)] +
        gray[(y + 1) * w + (x - 1)] +
        2 * gray[(y + 1) * w + x] +
        gray[(y + 1) * w + (x + 1)]
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy) > threshold ? 255 : 0
    }
  }
  return edges
}

export function detectCorners(imageData: ImageData): Corners {
  const { width: w, height: h, data } = imageData
  const gray = toGrayscale(data, w * h)
  const blurred = gaussianBlur3x3(gray, w, h)
  const edges = sobelEdges(blurred, w, h, 50)

  // Use diagonal projections to find the 4 extreme edge points
  let tlMin = Infinity, tlPt: Point = { x: 0, y: 0 }
  let trMax = -Infinity, trPt: Point = { x: w - 1, y: 0 }
  let brMax = -Infinity, brPt: Point = { x: w - 1, y: h - 1 }
  let blMin = Infinity, blPt: Point = { x: 0, y: h - 1 }

  let edgeCount = 0

  // Work at half resolution for speed
  const step = 2
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (edges[y * w + x] === 0) continue
      edgeCount++
      const s = x + y   // sum: min → TL, max → BR
      const d = x - y   // diff: max → TR, min → BL
      if (s < tlMin) { tlMin = s; tlPt = { x, y } }
      if (d > trMax) { trMax = d; trPt = { x, y } }
      if (s > brMax) { brMax = s; brPt = { x, y } }
      if (d < blMin) { blMin = d; blPt = { x, y } }
    }
  }

  const fallback: Corners = {
    tl: { x: Math.round(w * 0.1), y: Math.round(h * 0.1) },
    tr: { x: Math.round(w * 0.9), y: Math.round(h * 0.1) },
    br: { x: Math.round(w * 0.9), y: Math.round(h * 0.9) },
    bl: { x: Math.round(w * 0.1), y: Math.round(h * 0.9) },
  }

  if (edgeCount < 200) return fallback

  // Sanity check: make sure the quad is roughly rectangular
  const minDim = Math.min(w, h) * 0.15
  const width1 = Math.hypot(trPt.x - tlPt.x, trPt.y - tlPt.y)
  const width2 = Math.hypot(brPt.x - blPt.x, brPt.y - blPt.y)
  const height1 = Math.hypot(blPt.x - tlPt.x, blPt.y - tlPt.y)
  const height2 = Math.hypot(brPt.x - trPt.x, brPt.y - trPt.y)

  if (width1 < minDim || width2 < minDim || height1 < minDim || height2 < minDim) {
    return fallback
  }

  return { tl: tlPt, tr: trPt, br: brPt, bl: blPt }
}

export function imageDataFromDataUrl(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
