export default function Footer() {
  return (
    <footer className="bg-[#222] text-[#d9d9d9] py-8 px-5 mt-auto">

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 select-none">
          <img src="/sk_icon_no_bg.png" className="h-[24px] w-[24px]" alt="SK logo" loading="lazy" decoding="async" />
          <span className="font-bold text-[#fdb125]">SKEMS</span>
        </div>

        <p className="text-md text-[#a6a6a6] sm:text-sm">
          &copy; {new Date().getFullYear()} Sine Kultura Equipment Management System. All rights reserved.
        </p>
        
      </div>

    </footer>
  )
}
