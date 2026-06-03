import type { Equipment } from "../services/api"

export async function generateQRDoc(equipments: Equipment[]) {
  const { default: QRCode } = await import("qrcode")
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

  const rows: string[] = []

  for (let i = 0; i < equipments.length; i += 3) {
    const chunk = equipments.slice(i, i + 3)
    const cells = await Promise.all(
      chunk.map(async (eq) => {
        const content = `${baseUrl}/equipment?id=${eq.id}`
        const dataUrl = await QRCode.toDataURL(content, {
          width: 300,
          margin: 2,
        })
        return `<td style="width:33.33%;text-align:center;padding:12px 8px;vertical-align:top">
          <img src="${dataUrl}" width="150" height="150" style="display:block;margin:0 auto" />
          <div style="font-weight:bold;font-size:14pt;font-family:Arial,sans-serif;margin-top:8px">${eq.id}</div>
          <div style="font-size:11pt;font-family:Arial,sans-serif;color:#444;margin-top:2px">${eq.name}</div>
        </td>`
      }),
    )

    while (cells.length < 3) cells.push("<td></td>")
    rows.push(`<tr>${cells.join("")}</tr>`)
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 2cm; }
  body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; }
</style>
</head>
<body>
<table>${rows.join("")}</table>
</body>
</html>`

  const blob = new Blob([html], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "equipment-qr-codes.doc"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
