// components/landing/HeroSection.tsx
// Above-fold hero: brand mark, headline, tagline, trust chips, film strip, CTA, divider

import { BookStrip } from './BookStrip'

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fffbf5 0%, #fef3c7 40%, #fde8c8 100%)',
      }}
    >
      {/* Illustrated SVG background scatter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {/* Stars */}
        <svg className="absolute top-[8%] left-[7%] w-8 h-8 text-amber-300 opacity-30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        <svg className="absolute top-[15%] right-[12%] w-5 h-5 text-amber-400 opacity-20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        <svg className="absolute bottom-[25%] left-[5%] w-6 h-6 text-amber-300 opacity-25" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        {/* Moon */}
        <svg className="absolute top-[5%] right-[6%] w-10 h-10 text-amber-300 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {/* Open book */}
        <svg className="absolute top-[30%] right-[4%] w-14 h-14 text-amber-400 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        {/* Sparkle cluster */}
        <svg className="absolute bottom-[30%] right-[8%] w-12 h-12 text-amber-500 opacity-15" viewBox="0 0 48 48" fill="currentColor">
          <circle cx="24" cy="6" r="3"/>
          <circle cx="42" cy="24" r="3"/>
          <circle cx="24" cy="42" r="3"/>
          <circle cx="6" cy="24" r="3"/>
          <circle cx="38" cy="10" r="2"/>
          <circle cx="38" cy="38" r="2"/>
          <circle cx="10" cy="38" r="2"/>
          <circle cx="10" cy="10" r="2"/>
        </svg>
        {/* Wavy lines */}
        <svg className="absolute top-[45%] left-[2%] w-20 h-6 text-amber-300 opacity-20" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0 12 Q10 4 20 12 Q30 20 40 12 Q50 4 60 12 Q70 20 80 12"/>
        </svg>
      </div>

      {/* Content column */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-4 max-w-2xl mx-auto">

        {/* Brand mark */}
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-2 font-fredoka text-base mb-8 shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          Inklings
        </div>

        {/* Headline — two-line mixed type */}
        <h1 className="flex flex-col items-center gap-1 mb-4">
          <span className="font-fredoka text-5xl md:text-6xl text-[#2d1a06] font-normal leading-none">
            A book made
          </span>
          <span
            className="font-caveat text-5xl md:text-6xl text-amber-600 font-semibold"
            style={{ transform: 'rotate(-1.5deg)', display: 'inline-block' }}
          >
            just for them.
            {/* Hand-drawn squiggle underline */}
            <svg
              className="w-full mt-[-4px]"
              viewBox="0 0 280 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 8 Q20 2 40 8 Q60 14 80 8 Q100 2 120 8 Q140 14 160 8 Q180 2 200 8 Q220 14 240 8 Q260 2 278 8"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h1>

        {/* Tagline */}
        <p className="font-nunito text-base md:text-lg text-amber-800 font-semibold max-w-md mb-6">
          Personalized illustrations. Their reading level. Ready in about 3 minutes.
        </p>

        {/* Trust chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {[
            { icon: '📚', label: '3 free books' },
            { icon: '✨', label: 'No account needed' },
            { icon: '🎯', label: 'Matched to their reading level' },
          ].map(chip => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-nunito text-sm font-semibold rounded-full px-4 py-1.5"
            >
              {chip.icon} {chip.label}
            </span>
          ))}
        </div>
      </div>

      {/* Film strip — full width */}
      <div className="relative z-10 w-full mb-8">
        <BookStrip />
      </div>

      {/* CTA + sub-note */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-8">
        <a
          href="#wizard"
          className="
            inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white
            font-fredoka text-xl rounded-2xl py-4 px-10
            hover:from-amber-600 hover:to-amber-700
            shadow-lg shadow-amber-300/40
            transition-all active:scale-[0.98]
          "
        >
          Make their book ✦
        </a>
        <p className="font-nunito text-xs text-amber-700/60">
          3 free books · no account · ready in minutes
        </p>

        {/* Scroll nudge */}
        <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
          <span className="font-caveat text-sm text-amber-800">scroll down to start</span>
          <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Wavy SVG divider — transitions hero to wizard zone */}
      <div className="absolute bottom-0 left-0 right-0 z-10" aria-hidden="true">
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}
