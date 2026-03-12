'use client'

// components/landing/StickyCTA.tsx
// Fixed pill at bottom of viewport — scrolls user to wizard

export function StickyCTA() {
  const scrollToWizard = () => {
    const el = document.getElementById('wizard')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <button
        onClick={scrollToWizard}
        className="
          pointer-events-auto
          bg-[#2d1a06] text-amber-400
          font-fredoka text-base
          rounded-full px-6 py-3
          shadow-lg shadow-amber-900/20
          hover:bg-[#3d2a14] active:scale-95
          transition-all
        "
      >
        ✦ Make a free book
      </button>
    </div>
  )
}
