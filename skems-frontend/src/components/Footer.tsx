import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const lineRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  // reanimate gold gradient line on scroll
  useEffect(() => {
    const el = lineRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShown(entry.isIntersecting)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer className="bg-[#050505] mt-auto text-base/5 pb-7">

      <div
        ref={lineRef}
        className={`h-0.5 mx-auto mb-8 bg-linear-to-r from-transparent via-[#fdb125] to-transparent ${shown ? "animate-gold-grow" : ""}`}
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-10 items-start pl-7 md:pl-4 md:gap-1 sm:pl-0 sm:flex-row sm:items-center justify-between">
        
        <div className="flex flex-col gap-2 select-none">
          <div className="text-lg font-bold text-[#fdb125] uppercase">
            Sine Kultura
          </div>

          <div className="text-gray-400/50 max-w-sm">
            Capturing the culture and arts through the lens of passionate student filmmakers and photographers at Bulacan State University.
          </div>
        </div>

        <div className="flex flex-col gap-3 select-none [&_span]:transition-colors [&_span]:duration-200 [&_span]:hover:text-[#c89116]">
          <div className="text-lg font-bold text-white uppercase">
            Explore
          </div>

          {/* TODO Work With Us = Contact on home page*/}
          <Link to="/our-work">
            <span> Portfolio </span>
          </Link>

          <Link to="/about">
            <span> Meet The Team </span>
          </Link>

          <Link to="/contact">
            <span> Work With Us </span>
          </Link>

        </div>

        <div className="flex flex-col gap-3">
          <div className="text-lg font-bold text-white uppercase">
            Contact Us
          </div>

          <span>Email: official@sinekultura.com</span>
          <span>Location: BulSU Office of Culture and Arts</span>
          
        </div>
          
      </div>
      
      <p className="text-center align-middle pt-10 text-[#a6a6a6]/50 sm:text-xs">
        &copy; {new Date().getFullYear()} Sine Kultura All rights reserved.
      </p>

    </footer>
  )
}
