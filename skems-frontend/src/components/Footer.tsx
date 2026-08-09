import { useEffect, useRef, useState } from "react";
import { FaFacebook, FaTiktok } from "react-icons/fa6"
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
    <footer className="bg-[#050505] text-base/4.8 pb-3">

      {/* the gold bar */}
      <div
        ref={lineRef}
        className={`h-0.5 mx-auto mb-8 bg-linear-to-r from-transparent via-[#fdb125] to-transparent ${shown ? "animate-gold-grow" : ""}`}
      />

      <div className="max-w-7xl mx-auto flex flex-col items-start pl-5 pr-5 justify-between gap-8 sm:flex-row sm:gap-12">
        
        <div className="flex flex-col gap-1 select-none">
          <div className="text-xs font-bold text-[#fdb125] uppercase">
            Sine Kultura
          </div>

          <div className="text-sm text-gray-400/50 max-w-xs">
            Capturing the culture and arts through the lens of passionate student filmmakers and photographers at Bulacan State University.
          </div>
        </div>

        <div className="flex flex-col select-none [&_span]:transition-colors [&_span]:duration-200 [&_span]:hover:text-[#c89116] [&_span]:text-xs [&_span]:font-medium gap-3 sm:gap-0">
          <div className="text-xs font-bold text-white uppercase">
            Explore
          </div>

          {/* TODO Work With Us = Contact on home page*/}
          <Link to="/our-work">
            <span> Portfolio </span>
          </Link>

          <Link to="/about">
            <span> Meet The Team </span>
          </Link>

          <Link to="/#partnerships">
            <span> Work With Us </span>
          </Link>

        </div>

        <div className="flex flex-col gap-1 [&_span]:text-sm">
          <div className="text-xs font-bold text-white uppercase">
            Contact Us
          </div>

          <span>Email: bulsusinekultura@gmail.com</span>
          <span>Location: BulSU Office of Culture and Arts</span>
          
        </div>
        
      
        <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-white uppercase">
              Follow Us
            </div>
            
            <div className="flex gap-2 cursor-pointer hover:text-[#c89116] transition-colors duration-200">
              <a href="https://www.facebook.com/sinekulturabulsu" target="/">
                <FaFacebook size={24} /> 
              </a>
              <span className="flex items-center text-xs italic">@sinekulturabulsu</span>
            </div>

            <div className="flex gap-2 cursor-pointer hover:text-[#c89116] transition-colors duration-200">
              <a href="https://www.tiktok.com/@bulsu.sinekultura" target="/">
                <FaTiktok size={24} /> 
              </a>
              <span className="flex items-center text-xs italic">@bulsu.sinekultura</span>
            </div>
        </div>

          
      </div>
      <p className="text-center align-middle pt-5 text-[#a6a6a6]/50 text-xs">
        &copy; {new Date().getFullYear()} Sine Kultura. All rights reserved.
      </p>

    </footer>
  )
}
