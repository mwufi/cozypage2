'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] text-white font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x">
                        Privacy Policy
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
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Ara AI ("we", "our", "us"). We are committed to protecting your personal information
                            and your right to privacy. If you have any questions or concerns about this privacy notice,
                            or our practices with regards to your personal information, please contact us.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">2. Information We Collect</h2>
                        <p>
                            We collect personal information that you voluntarily provide to us when you register on the
                            Services, express an interest in obtaining information about us or our products and Services,
                            when you participate in activities on the Services, or otherwise when you contact us.
                        </p>
                        <p>
                            The personal information that we collect depends on the context of your interactions with us and
                            the Services, the choices you make, and the products and features you use. The personal
                            information we collect may include the following: names; email addresses; passwords; contact
                            preferences; contact or authentication data; and other similar information.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">3. How We Use Your Information</h2>
                        <p>
                            We use personal information collected via our Services for a variety of business purposes
                            described below. We process your personal information for these purposes in reliance on our
                            legitimate business interests, in order to enter into or perform a contract with you, with
                            your consent, and/or for compliance with our legal obligations.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To facilitate account creation and logon process.</li>
                            <li>To post testimonials.</li>
                            <li>Request feedback.</li>
                            <li>To enable user-to-user communications.</li>
                            <li>To manage user accounts.</li>
                            <li>To send administrative information to you.</li>
                            <li>To protect our Services.</li>
                            <li>To respond to legal requests and prevent harm.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">4. Will Your Information Be Shared With Anyone?</h2>
                        <p>
                            We only share information with your consent, to comply with laws, to provide you with services,
                            to protect your rights, or to fulfill business obligations.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">5. How Long Do We Keep Your Information?</h2>
                        <p>
                            We keep your information for as long as necessary to fulfill the purposes outlined in this
                            privacy notice unless otherwise required by law.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">6. How Do We Keep Your Information Safe?</h2>
                        <p>
                            We aim to protect your personal information through a system of organizational and technical
                            security measures.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">7. What Are Your Privacy Rights?</h2>
                        <p>
                            In some regions (like the EEA and UK), you have certain rights under applicable data protection
                            laws. These may include the right (i) to request access and obtain a copy of your personal
                            information, (ii) to request rectification or erasure; (iii) to restrict the processing of
                            your personal information; and (iv) if applicable, to data portability. In certain
                            circumstances, you may also have the right to object to the processing of your personal
                            information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">8. Contact Us</h2>
                        <p>
                            If you have questions or comments about this notice, you may email us at privacy@example.com.
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