// app/page.tsx — Inklings landing page: hero + 4-step wizard

import { HeroSection }    from '@/components/landing/HeroSection'
import { BookFormWizard } from '@/components/landing/BookFormWizard'
import { StickyCTA }      from '@/components/landing/StickyCTA'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Zone 1: Hero (above fold) */}
      <HeroSection />

      {/* Zone 2: Wizard (below fold) */}
      <section
        className="relative bg-white px-6 py-16"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fffbf5 100%)',
        }}
      >
        {/* Low-opacity SVG scatter — mirrors hero density */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="absolute top-8 left-8 w-6 h-6 text-amber-300 opacity-20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <svg className="absolute bottom-8 right-8 w-8 h-8 text-amber-400 opacity-15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <BookFormWizard />
        <p className="text-center font-nunito text-xs text-amber-700/40 mt-8">
          Shareable link stays active for 30 days · No email required
        </p>
      </section>

      <StickyCTA />
    </main>
  )
}
