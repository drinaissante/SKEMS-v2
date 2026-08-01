export default function Footer() {
  return (
    <footer className="bg-[#050505] text-[#d9d9d9] py-14 px-8 mt-auto">

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="flex flex-col gap-2 select-none">
          <div className="text-lg font-bold text-[#fdb125] uppercase">
            Sine Kultura
          </div>

          <div className="text-gray-400/50 max-w-3xs text-base/5">
            Capturing the culture and arts through the lens of passionate student filmmakers and photographers at Bulacan State University.
          </div>
        </div>

        <div className="flex flex-col [&_span]:text-gray-400/50 gap-3">
          <div className="text-lg font-bold text-white uppercase">
            Explore
          </div>

          <span>Portfolio</span>
          <span>Meet The Team</span>
          <span>Work With Us</span>

        </div>

        <div className="flex flex-col [&_span]:text-gray-400/50 gap-3 pb-8">
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
