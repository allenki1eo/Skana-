import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcInput = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([len, t, data, crc])
}

function createPNG(size, drawPixel) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  const stride = 1 + size * 3
  const raw = Buffer.alloc(stride * size, 0)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = drawPixel(x, y, size)
      const o = y * stride + 1 + x * 3
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function drawPixel(x, y, size) {
  const BG = [0x0f, 0x0f, 0x0f]
  const ACC = [0x00, 0xe6, 0x76]
  const SURF = [0x1a, 0x1a, 0x1a]

  // Rounded rect background (corner radius ~15%)
  const r = size * 0.15
  const cx = x - size / 2, cy = y - size / 2
  const hw = size / 2, hh = size / 2
  const dx = Math.max(0, Math.abs(cx) - (hw - r))
  const dy = Math.max(0, Math.abs(cy) - (hh - r))
  if (dx * dx + dy * dy > r * r) return BG

  // Document card centered
  const pad = size * 0.18
  const dw = size - pad * 2
  const dh = dw * 1.28
  const dx0 = pad, dy0 = (size - dh) / 2
  const fold = dw * 0.28

  const inDoc = x >= dx0 && x <= dx0 + dw && y >= dy0 && y <= dy0 + dh
  if (inDoc) {
    // Fold corner
    const inFold = x >= dx0 + dw - fold && y <= dy0 + fold &&
      (x - (dx0 + dw - fold)) + (y - dy0) <= fold
    if (inFold) return ACC

    // Document body
    const lx1 = dx0 + dw * 0.2, lx2 = dx0 + dw * 0.75
    const ly1 = dy0 + dh * 0.42, ly2 = dy0 + dh * 0.56, ly3 = dy0 + dh * 0.70
    const thick = Math.max(2, size * 0.025)

    if (x >= lx1 && x <= lx2 && (
      (y >= ly1 && y <= ly1 + thick) ||
      (y >= ly2 && y <= ly2 + thick) ||
      (y >= ly3 && y <= ly3 + thick * 0.75)
    )) return ACC

    return SURF
  }

  // Border
  const borderW = size * 0.035
  const onBorder = (
    (x >= dx0 && x <= dx0 + borderW && y >= dy0 && y <= dy0 + dh) ||
    (x >= dx0 + dw - borderW && x <= dx0 + dw && y >= dy0 && y <= dy0 + dh) ||
    (y >= dy0 && y <= dy0 + borderW && x >= dx0 && x <= dx0 + dw) ||
    (y >= dy0 + dh - borderW && y <= dy0 + dh && x >= dx0 && x <= dx0 + dw)
  )
  if (onBorder) return ACC

  return BG
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', createPNG(192, drawPixel))
writeFileSync('public/icons/icon-512.png', createPNG(512, drawPixel))
console.log('Icons generated successfully.')
