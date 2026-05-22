import type { ScannedPage } from '../types'

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPDF(pages: ScannedPage[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    doc.addImage(pages[i].finalDataUrl, 'JPEG', 0, 0, 595.28, 841.89)
  }
  doc.save(`skana-${Date.now()}.pdf`)
}

export async function exportZip(pages: ScannedPage[]) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  pages.forEach((p, i) => {
    const base64 = p.finalDataUrl.split(',')[1]
    zip.file(`page-${i + 1}.jpg`, base64, { base64: true })
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(URL.createObjectURL(blob), `skana-${Date.now()}.zip`)
}

export function exportSingleImage(page: ScannedPage) {
  triggerDownload(page.finalDataUrl, `skana-${Date.now()}.jpg`)
}

export async function shareToWhatsApp(pages: ScannedPage[]) {
  try {
    const page = pages[0]
    const res = await fetch(page.finalDataUrl)
    const blob = await res.blob()
    const file = new File([blob], `skana-${Date.now()}.jpg`, { type: 'image/jpeg' })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Scanned Document' })
      return
    }
  } catch {
    // fall through to WhatsApp link
  }
  window.open('https://wa.me/?text=Here%20is%20my%20scanned%20document')
}
