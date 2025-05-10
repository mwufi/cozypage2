'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] text-white font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x">
            Terms of Service
          </h1>
          <p className="text-lg text-white/80 mt-4">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <nav className="mb-8 text-center">
          <Link href="/" className="text-blue-300 hover:text-white transition-colors">
            &larr; Back to Home
          </Link>
        </nav>

        <main className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">1. Agreement to Terms</h2>
            <p>
              By using our Services, you agree to be bound by these Terms. If you do not agree to be bound by
              these Terms, do not use the Services. If you are accessing and using the Services on behalf of a
              company (such as your employer) or other legal entity, you represent and warrant that you have
              the authority to bind that entity to these Terms. In that case, "you" and "your" will refer to
              that entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">2. Privacy Policy</h2>
            <p>
              Please review our Privacy Policy, which also governs your use of the Services, for information on
              how we collect, use and share your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">3. Changes to Terms or Services</h2>
            <p>
              We may update the Terms from time to time in our sole discretion. If we do, we'll let you know
              by posting the updated Terms on the Site and/or may also send other communications. It's
              important that you review the Terms whenever we update them or you use the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">4. Who May Use the Services</h2>
            <p>
              You may use the Services only if you are 13 years or older and capable of forming a binding
              contract with Ara AI, and not otherwise barred from using the Services under applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">5. Content Ownership</h2>
            <p>
              We do not claim any ownership rights in any User Content and nothing in these Terms will be
              deemed to restrict any rights that you may have to use and exploit your User Content. Subject to
              the foregoing, Ara AI and its licensors exclusively own all right, title and interest in and to
              the Services and Content, including all associated intellectual property rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">6. Termination</h2>
            <p>
              We may suspend or terminate your access to and use of the Services, including suspending access
              to or terminating your account, at our sole discretion, at any time and without notice to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">7. Contact Information</h2>
            <p>
              If you have any questions about these Terms or the Services, please contact us at tos@example.com.
            </p>
          </section>
        </main>

        <footer className="mt-12 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} Ara AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
} 