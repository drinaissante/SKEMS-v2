import { useState } from "react"

export default function MemberAvatar({
  image,
  name,
  size = 28,
}: {
  image?: string
  name: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setFailed(true)}
        className="rounded-full border border-[#c89116]/60 object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className="rounded-full border border-[#c89116]/60 bg-white/5 text-[#c89116] font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  )
}
