import { Link, useLocation } from "react-router-dom"
import type { MouseEvent, ReactNode } from "react"

interface NavLinkProps {
  to: string
  className?: string
  onClick?: () => void
  children: ReactNode
}

export default function NavLink({ to, className, onClick, children }: NavLinkProps) {
  const { pathname } = useLocation()
  const targetPath = to.split("#")[0]

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const isSamePage = !to.includes("#") && targetPath === pathname
    if (isSamePage) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    onClick?.()
  }

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
