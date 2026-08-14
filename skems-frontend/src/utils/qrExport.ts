import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from "docx"
import type { Equipment } from "../services/api"

const QR_SIZE = 150
const LABELS_PER_ROW = 3

function qrParagraph(data: string, opts: IParagraphOptions): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 120 },
    children: [
      new ImageRun({
        type: "png",
        data,
        transformation: { width: QR_SIZE, height: QR_SIZE },
      }),
    ],
    ...opts,
  })
}

export async function generateQRDoc(equipments: Equipment[]) {
  const { default: QRCode } = await import("qrcode")
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

  const rows: TableRow[] = []

  for (let i = 0; i < equipments.length; i += LABELS_PER_ROW) {
    const chunk = equipments.slice(i, i + LABELS_PER_ROW)
    const cells = await Promise.all(
      chunk.map(async (eq) => {
        const content = `${baseUrl}/equipment?id=${eq.id}`
        const dataUrl = await QRCode.toDataURL(content, {
          width: 300,
          margin: 2,
          type: "image/png",
        })
        return new TableCell({
          width: { size: 100 / LABELS_PER_ROW, type: WidthType.PERCENTAGE },
          children: [
            qrParagraph(dataUrl, {}),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 },
              children: [new TextRun({ text: eq.id, bold: true, size: 22 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 },
              children: [new TextRun({ text: eq.name, size: 20, color: "444444" })],
            }),
          ],
        })
      }),
    )

    while (cells.length < LABELS_PER_ROW) {
      cells.push(new TableCell({ width: { size: 100 / LABELS_PER_ROW, type: WidthType.PERCENTAGE }, children: [] }))
    }
    rows.push(new TableRow({ children: cells }))
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "equipment-qr-codes.docx"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
