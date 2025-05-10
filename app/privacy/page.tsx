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
                            Welcome to Ara AI ("we", "our", "us"). This Privacy Policy describes how we collect, use, and handle your personal information, including Google Workspace data (Gmail, Google Drive, and Google Calendar), when you use our productivity application. We are committed to protecting your privacy and ensuring the security of your data.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">2. Information We Collect</h2>
                        <h3 className="text-xl font-semibold text-blue-200 mb-2">2.1 General Information</h3>
                        <p>
                            We collect personal information that you voluntarily provide to us when you register on our
                            Services, express an interest in obtaining information about us or our products and Services,
                            when you participate in activities on the Services, or otherwise when you contact us.
                        </p>

                        <h3 className="text-xl font-semibold text-blue-200 mb-2">2.2 Google Workspace Data</h3>
                        <p>
                            When you connect your Google Workspace account to our application, we may collect and process the following data:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Gmail Data:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Email headers (subject, sender, recipient, date)</li>
                                    <li>Email content for productivity analysis</li>
                                    <li>Email labels and categories</li>
                                </ul>
                            </li>
                            <li><strong>Google Drive Data:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>File metadata (name, type, size, last modified)</li>
                                    <li>File content for productivity features</li>
                                    <li>Folder structure and organization</li>
                                </ul>
                            </li>
                            <li><strong>Google Calendar Data:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Calendar events and meetings</li>
                                    <li>Event details (title, time, location, attendees)</li>
                                    <li>Calendar availability and scheduling preferences</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">3. How We Use Your Information</h2>
                        <h3 className="text-xl font-semibold text-blue-200 mb-2">3.1 General Usage</h3>
                        <p>
                            We use personal information collected via our Services for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and maintain our productivity Services</li>
                            <li>To manage user accounts and preferences</li>
                            <li>To communicate with you about our Services</li>
                            <li>To protect our Services and users</li>
                            <li>To comply with legal obligations</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-200 mb-2">3.2 Google Workspace Data Usage</h3>
                        <p>
                            We use Google Workspace data solely for the following productivity purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Gmail Integration:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Email organization and prioritization</li>
                                    <li>Smart email categorization</li>
                                    <li>Response suggestions and templates</li>
                                </ul>
                            </li>
                            <li><strong>Google Drive Integration:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Document organization and search</li>
                                    <li>Content analysis for productivity insights</li>
                                    <li>Smart file categorization</li>
                                </ul>
                            </li>
                            <li><strong>Google Calendar Integration:</strong>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Schedule optimization and management</li>
                                    <li>Meeting insights and analytics</li>
                                    <li>Smart scheduling suggestions</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">4. Data Sharing and Disclosure</h2>
                        <p>
                            We do not sell, rent, or trade your Google Workspace data to third parties. We may share your information only in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>With service providers who assist in operating our application (subject to strict confidentiality obligations)</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and prevent fraud</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">5. Data Protection and Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your data, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>End-to-end encryption for all data in transit and at rest</li>
                            <li>Regular security assessments and updates</li>
                            <li>Strict access controls and authentication mechanisms</li>
                            <li>Secure data storage and processing practices</li>
                            <li>Regular security audits and compliance checks</li>
                            <li>Data minimization and purpose limitation</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">6. Data Retention and Deletion</h2>
                        <p>
                            We retain your data only for as long as necessary to provide our Services and fulfill the purposes outlined in this policy. You can request deletion of your data at any time by:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Using the "Delete Account" feature in our application</li>
                            <li>Contacting our support team</li>
                            <li>Revoking access through your Google Account settings</li>
                        </ul>
                        <p className="mt-4">
                            Upon receiving a deletion request, we will:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Delete all your personal information from our systems</li>
                            <li>Remove all Google Workspace data from our application</li>
                            <li>Revoke all access tokens and permissions</li>
                            <li>Provide confirmation of deletion</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">7. Your Rights and Choices</h2>
                        <p>
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access your personal information and Google Workspace data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Object to processing of your data</li>
                            <li>Withdraw consent at any time</li>
                            <li>Control which Google Workspace services you connect to our application</li>
                            <li>Modify or revoke access permissions at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4">8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <p className="mt-2">
                            Email: privacy@ara-ai.com<br />
                            Address: [Your Company Address]
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