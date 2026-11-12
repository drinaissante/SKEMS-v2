const MAX_DIM = 1024
const QUALITY = 0.6

/**
 * Compress an image (captured data URL or uploaded file) into a small JPEG
 * blob suitable for storage on the Supabase free tier (~100-250 KB).
 */
export async function compressImage(source: File | Blob | string): Promise<Blob> {
  const dataUrl = typeof source === "string"
    ? source
    : await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.onerror = () => reject(new Error("Failed to read image file."))
        reader.readAsDataURL(source as Blob)
      })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image."))
    image.src = dataUrl
  })

  let w = img.width
  let h = img.height
  if (w > MAX_DIM || h > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h)
    w = Math.round(w * ratio)
    h = Math.round(h * ratio)
  }

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to process image.")
  ctx.drawImage(img, 0, 0, w, h)

  const out = canvas.toDataURL("image/jpeg", QUALITY)
  const byteString = atob(out.split(",")[1])
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i)
  return new Blob([bytes], { type: "image/jpeg" })
}
