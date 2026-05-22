import type { Corners } from '../types'

// Gaussian elimination with partial pivoting for Ax = b
function gaussElim(A: number[][], b: number[]): number[] {
  const n = b.length
  const mat = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(mat[row][col]) > Math.abs(mat[maxRow][col])) maxRow = row
    }
    ;[mat[col], mat[maxRow]] = [mat[maxRow], mat[col]]

    if (Math.abs(mat[col][col]) < 1e-12) continue

    for (let row = col + 1; row < n; row++) {
      const f = mat[row][col] / mat[col][col]
      for (let k = col; k <= n; k++) mat[row][k] -= f * mat[col][k]
    }
  }

  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = mat[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= mat[i][j] * x[j]
    x[i] /= mat[i][i]
  }
  return x
}

// Compute homography H (9 elements, last = 1) mapping src → dst
// H maps [x,y,1]^T (homogeneous) to [u,v,1]^T up to scale
function computeHomography(
  src: [number, number][],
  dst: [number, number][],
): number[] {
  const A: number[][] = []
  const b: number[] = []

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]
    const [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u])
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v])
    b.push(u, v)
  }

  const h = gaussElim(A, b)
  return [...h, 1]
}

function applyH(H: number[], px: number, py: number): [number, number] {
  const w = H[6] * px + H[7] * py + H[8]
  const x = (H[0] * px + H[1] * py + H[2]) / w
  const y = (H[3] * px + H[4] * py + H[5]) / w
  return [x, y]
}

function bilinear(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  x: number,
  y: number,
  out: Uint8ClampedArray,
  outIdx: number,
) {
  const x0 = x | 0
  const y0 = y | 0
  const x1 = Math.min(x0 + 1, sw - 1)
  const y1 = Math.min(y0 + 1, sh - 1)
  const fx = x - x0
  const fy = y - y0

  const i00 = (y0 * sw + x0) * 4
  const i10 = (y0 * sw + x1) * 4
  const i01 = (y1 * sw + x0) * 4
  const i11 = (y1 * sw + x1) * 4

  for (let c = 0; c < 4; c++) {
    const top = data[i00 + c] + (data[i10 + c] - data[i00 + c]) * fx
    const bot = data[i01 + c] + (data[i11 + c] - data[i01 + c]) * fx
    out[outIdx + c] = top + (bot - top) * fy
  }
}

export async function perspectiveWarp(
  rawDataUrl: string,
  corners: Corners,
  outWidth = 595,
  outHeight = 842,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const sw = img.naturalWidth
      const sh = img.naturalHeight

      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = sw
      srcCanvas.height = sh
      const srcCtx = srcCanvas.getContext('2d')!
      srcCtx.drawImage(img, 0, 0)
      const srcData = srcCtx.getImageData(0, 0, sw, sh)

      const dst: [number, number][] = [
        [0, 0],
        [outWidth - 1, 0],
        [outWidth - 1, outHeight - 1],
        [0, outHeight - 1],
      ]
      const src: [number, number][] = [
        [corners.tl.x, corners.tl.y],
        [corners.tr.x, corners.tr.y],
        [corners.br.x, corners.br.y],
        [corners.bl.x, corners.bl.y],
      ]

      // H maps dst → src (inverse warp: for each output pixel find source pixel)
      const H = computeHomography(dst, src)

      const outCanvas = document.createElement('canvas')
      outCanvas.width = outWidth
      outCanvas.height = outHeight
      const outCtx = outCanvas.getContext('2d')!
      const outImg = outCtx.createImageData(outWidth, outHeight)
      const outData = outImg.data

      for (let v = 0; v < outHeight; v++) {
        for (let u = 0; u < outWidth; u++) {
          const [sx, sy] = applyH(H, u, v)
          if (sx < 0 || sx >= sw - 1 || sy < 0 || sy >= sh - 1) continue
          bilinear(srcData.data, sw, sh, sx, sy, outData, (v * outWidth + u) * 4)
        }
      }

      // Set full alpha for output pixels
      for (let i = 3; i < outData.length; i += 4) {
        if (outData[i] === 0) outData[i] = 255
      }

      outCtx.putImageData(outImg, 0, 0)
      resolve(outCanvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = rawDataUrl
  })
}
