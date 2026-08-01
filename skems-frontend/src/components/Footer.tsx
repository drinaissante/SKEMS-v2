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

        <div>
          <p>EXPLORE</p>
        </div>

        <div>
          <p>CONTACT</p>
        </div>
          
      </div>
      
      <p className="text-md text-[#a6a6a6] sm:text-sm">
        &copy; {new Date().getFullYear()} Sine Kultura All rights reserved.
      </p>

    </footer>
  )
}
