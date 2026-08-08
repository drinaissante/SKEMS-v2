interface GradientLineProps {
  className?: string
}

export default function GradientLine({ className = "" }: GradientLineProps) {
  return (
    <div
      className={`h-px bg-linear-to-r from-transparent via-[#fdb125] to-transparent ${className}`}
    />
  )
}
