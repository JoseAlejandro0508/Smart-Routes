import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/** Opciones del encabezado y nombre del PDF exportado. */
export interface ExportPdfOptions {
  /** Título principal del documento. */
  title: string
  /** Descripción o subtítulo. */
  subtitle?: string
  /** Filtros/criterios aplicados (se listan en el encabezado). */
  filters?: string[]
  /** Nombre del archivo (sin extensión). */
  filename?: string
}

/**
 * Exporta un elemento del DOM a un archivo PDF, incluyendo un encabezado con
 * título, filtros y fecha de generación. Captura lo visible en el elemento,
 * respetando el orden y estado actual.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  { title, subtitle, filters = [], filename }: ExportPdfOptions,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  let y = margin

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(title, margin, y)
  y += 7

  if (subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    const lines = pdf.splitTextToSize(subtitle, contentWidth)
    pdf.text(lines, margin, y)
    y += lines.length * 5 + 1
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(90)
  const meta = [
    `Fecha de exportación: ${new Date().toLocaleString('es-ES')}`,
    ...filters.map((filter) => `Filtro: ${filter}`),
  ]
  for (const line of meta) {
    pdf.text(line, margin, y)
    y += 4
  }
  pdf.setTextColor(0)
  y += 3

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const pageContentHeight = pageHeight - margin - y

  let heightLeft = imgHeight
  let position = y

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= pageContentHeight

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  const safeName = (filename ?? title).replace(/[^\w\s.-]+/g, '').trim() || 'reporte'
  pdf.save(`${safeName}.pdf`)
}
