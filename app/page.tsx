// app/page.tsx — Home page: hero + book creation form

import { BookForm } from '@/components/form/BookForm'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-amber-50">
      {/* Hero */}
      <section className="px-6 pt-12 pb-8 text-center max-w-2xl mx-auto">
        {/* Brand mark */}
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Story Spark
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          A personalized book,{' '}
          <span className="text-amber-500">just for them.</span>
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto mb-3">
          Generate a 10-page illustrated children&apos;s book tailored to your child&apos;s name, age, and reading level — in under 3 minutes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 mb-10">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            3 free books
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            No account needed
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Matched to their reading level
          </span>
        </div>
      </section>

      {/* Form card */}
      <section
        className="mx-auto max-w-xl px-6 pb-16"
        aria-label="Create your personalized book"
      >
        <div className="bg-white rounded-3xl shadow-lg border border-amber-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Tell us about your child
          </h2>
          <BookForm />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Shareable link stays active for 30 days. No email required.
        </p>
      </section>
    </main>
  )
}
