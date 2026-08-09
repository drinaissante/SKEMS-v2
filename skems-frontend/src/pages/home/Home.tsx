import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, useState, useMemo } from "react"

import { cacheHeroVideo, getCachedHeroVideo } from "../../utils/videoCache"

import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useTypewriter } from "../../hooks/useTypewriter"

import mainMp4 from "/hero-optimized-2.mp4"

export default function Home() {
  usePageTitle("Home")
  const { isLoggedIn, isAdmin, user } = useAuth()

  const location = useLocation()

  useEffect(() => {
    if (location.hash === "#partnerships") {
      document.getElementById("partnerships")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [location])

  const welcomeTexts = useMemo(
    () => [
      `Welcome back, ${user?.fullName}!`,
      "Ready to scan some equipment?",
      "Explore the latest masterpieces",
    ],
    [user?.fullName]
  )
  const { output, holding } = useTypewriter(welcomeTexts)

  const [ bgUrl, setBgUrl ] = useState('');

  useEffect(() => {
    const init = async () => {
      const cachedBlobUrl = await getCachedHeroVideo();

      if (cachedBlobUrl) {
        setBgUrl(cachedBlobUrl);
      } else {
        setBgUrl(mainMp4)

        await cacheHeroVideo(mainMp4);
      }
    }

    init();

    return () => {
      if (bgUrl && bgUrl.startsWith('blob:')) {
        URL.revokeObjectURL(bgUrl);
      }
    };
  }, []);


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
    <>
      {/* hero */}
      <div className="relative min-h-screen">
        {bgUrl && (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={bgUrl} type="video/mp4" />
          </video>
        )}

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">

          {isLoggedIn ? (
          <>
              {/* make this typing animated when logged in */}
              <p className="text-sm sm:text-base mb-8 max-w-md bg-linear-to-r from-[#cab453] to-[#ffd000] bg-clip-text text-transparent">
                {output}
                {holding && <span className="animate-pulse text-white/80">|</span>}
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full max-w-3xl">
                <Link
                  to="/scan"
                  className="w-full sm:flex-1 sm:min-w-40 py-3 border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-xl transition-colors text-sm sm:text-base"
                >
                  Scan QR
                </Link>
                <Link
                  to="/request"
                  className="w-full sm:flex-1 sm:min-w-10 py-3 border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-xl transition-colors text-sm sm:text-base"
                >
                  Borrow
                </Link>
                <Link
                  to="/my-requests"
                  className="w-full sm:flex-1 sm:min-w-40 px-5 py-3 bg-[#222] hover:bg-[#666] text-white font-bold rounded-xl transition-colors shadow text-sm sm:text-base"
                >
                  My Requests
                </Link>
                <Link
                  to="/profile"
                  className="w-full sm:flex-1 sm:min-w-40 px-8 py-3 bg-[#222] hover:bg-[#666] text-white font-bold rounded-xl transition-colors shadow text-sm sm:text-base"
                >
                  My Profile
                </Link>
              </div>

              {isAdmin && (
                <div className="flex justify-center w-full max-w-3xl mt-3">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-1/3 px-10 py-3 border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-xl transition-colors text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
          </>
          ) : (
            <>
              <p className="text-white/80 text-lg sm:text-lg mb-8 max-w-md">
                Same passion, new vision.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-md">
                <Link
                  to="/register"
                  className="w-full sm:flex-1 px-10 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors duration-200 shadow text-sm sm:text-base"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:flex-1 px-10 py-3 border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  Login
                </Link>
              </div>
            </>
          )}

        </div>
      </div>

      {/* our work / portfolio */}
      <section className="bg-fixed-black px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-white text-center mb-2">
            Latest Masterpieces
          </h2>
          <p className="text-sm sm:text-xs text-gray-400 text-center mb-8 max-w-xl mx-auto">
            A glimpse into our recent cinematic and photographic journeys.
          </p>

          {/*  TODO: placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-transparent rounded-xl shadow=xl border border-[#5f5c5c93] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#fdb125]"
              >
                <div className="w-full h-40 bg-[#d9d9d9a9]" />
                <div className="p-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#caa453]/20 ">
                    Type
                  </span>
                  <h3 className="font-bold text-[#c89116] text-sm sm:text-base mt-2">
                    Placeholder Title
                  </h3>
                  <p className="text-xs text-[#a6a6a6] mt-1">
                    Placeholder description text.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Link
              to="/our-work"
              className="inline-block px-10 py-3 border-2 border-[#c89116] text-[#c89116] bg-transparent hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-lg transition-colors duration-200 text-sm sm:text-base uppercase"
            >
              View Full Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* partner with us */}
      <section id="partnerships" className="bg-fixed-black py-6 scroll-mt-24">
      
        {/* the gold bar */}
        <div
          ref={lineRef}
          className={`h-0.5 mx-auto mb-8 bg-linear-to-r from-transparent via-[#fdb125] to-transparent ${shown ? "animate-gold-grow" : ""}`}
        />

        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center mb-2">
            Partner With Us
          </h2>

          <p className="text-sm sm:text-xs text-gray-400 text-center  max-w-xl mx-auto">
            Have a project in mind? Let's collaborate.
          </p>

          {/* TODO: make this submit to discord  */}
          <form
            className=" p-5 sm:p-8 space-y-4"
            onSubmit={(e) => e.preventDefault()} 
          >
            <div>
              <label htmlFor="partner-name" className="block text-sm font-medium text-[#666] mb-1">
                Organization / Name <span className="text-red-500">*</span>
              </label>
              <input
                id="partner-name"
                type="text"
                required
                maxLength={150}
                placeholder="Organization / Your Full Name"
                className="w-full px-3 py-2 text-sm border border-[#5f5c5c93] rounded-lg focus:outline-none focus:border-[#fdb125] text-white placeholder-gray-600 transition-color duration-300"
              />
            </div>

            <div>
              <label htmlFor="partner-email" className="block text-sm font-medium text-[#666] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="partner-email"
                type="email"
                required
                maxLength={254}
                placeholder="you@organization.com"
                className="w-full px-3 py-2 text-sm border border-[#5f5c5c93] rounded-lg focus:outline-none focus:border-[#fdb125] text-white placeholder-gray-600 transition-color duration-300"
              />
            </div>

            <div>
              <label htmlFor="partner-details" className="block text-sm font-medium text-[#666] mb-1">
                Project Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="partner-details"
                required
                rows={5}
                maxLength={3000}
                placeholder="Describe your project, goals, and how you'd like to partner..."
                className="w-full px-3 py-2 text-sm border border-[#5f5c5c93] rounded-lg focus:outline-none focus:border-[#fdb125] text-white resize-y placeholder-gray-600 transition-color duration-300"
              />
            </div>

            <div>
              <label htmlFor="partner-letter" className="block text-sm font-medium text-[#666] mb-1">
                Attach Formal Letter / Proposal <span className="text-red-500">*</span>
              </label>
              <input
                id="partner-letter"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="text-sm text-[#666] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-[#c89116] file:text-white file:cursor-pointer"
              />
              <p className="text-xs italic text-[#a6a6a6] mt-1">Accepted formats: PDF, Word (.doc, .docx)</p>
            </div>

            <button
              type="submit"
              className="flex justify-self-center px-10 py-3 border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white font-bold rounded-lg transition-colors duration-200 cursor-pointer text-sm sm:text-base"
            >
              Send Request
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
