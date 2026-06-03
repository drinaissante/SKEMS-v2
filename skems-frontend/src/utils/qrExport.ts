import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, AlignmentType, TextRun, ImageRun,
} from "docx"
import type { Equipment } from "../services/api"

const QR_SIZE_PX = 150

export async function generateQRDoc(equipments: Equipment[]) {
  const { default: QRCode } = await import("qrcode")
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

  const rows: TableRow[] = []

  for (let i = 0; i < equipments.length; i += 3) {
    const chunk = equipments.slice(i, i + 3)
    const cells: TableCell[] = []

    for (const eq of chunk) {
      const content = `${baseUrl}/equipment?id=${eq.id}`
      const dataUrl = await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
      })
      const base64 = dataUrl.split(",")[1]
      const imageBytes = Uint8Array.from(atob(base64), (c) =>
        c.charCodeAt(0),
      )

      cells.push(
        new TableCell({
          width: { size: 33, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 },
              children: [
                new ImageRun({
                  data: imageBytes,
                  transformation: {
                    width: QR_SIZE_PX * 9525,
                    height: QR_SIZE_PX * 9525,
                  },
                  type: "png",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [
                new TextRun({ text: eq.id, bold: true, size: 22, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({ text: eq.name, size: 18, font: "Arial" }),
              ],
            }),
          ],
        }),
      )
    }

    while (cells.length < 3) {
      cells.push(new TableCell({ children: [new Paragraph({ children: [] })] }))
    }

    rows.push(new TableRow({ children: cells }))
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              right: 1134,
              bottom: 1134,
              left: 1134,
            },
          },
        },
        children: [
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
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
