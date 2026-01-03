import { PublicLayout } from '../components/layout/PublicLayout';

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <div className="flex-1 py-16 px-6 max-w-4xl mx-auto w-full min-h-[calc(100vh-4rem)]">
                <h1 className="text-4xl font-bold tracking-tighter mb-8">Privacy Policy</h1>
                <p className="text-sm text-zinc-500 mb-8">Last updated: January 2, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">We collect information that you provide directly to us:</p>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, profile photo</li>
                            <li><strong>Profile Data:</strong> Skills, experience, portfolio links, bio</li>
                            <li><strong>Mission Data:</strong> Project descriptions, requirements, budgets</li>
                            <li><strong>Communications:</strong> Messages sent through our platform</li>
                            <li><strong>Payment Information:</strong> Processed securely through Stripe</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li>To provide, maintain, and improve our services</li>
                            <li>To match Contributors with relevant missions</li>
                            <li>To process transactions and send related information</li>
                            <li>To send notifications about your account and missions</li>
                            <li>To respond to your comments and questions</li>
                            <li>To detect and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Information Sharing</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">We do not sell your personal information. We may share information:</p>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li>With other users as part of platform functionality (e.g., profile visibility)</li>
                            <li>With service providers who assist in our operations (e.g., Stripe, Firebase)</li>
                            <li>If required by law or to protect our rights</li>
                            <li>In connection with a merger or acquisition</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We implement industry-standard security measures to protect your data. This includes encryption
                            in transit and at rest, secure authentication through Firebase, and regular security audits.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update inaccurate information</li>
                            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                            <li><strong>Export:</strong> Download your data in a portable format</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Cookies</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We use essential cookies for authentication and session management. We do not use
                            tracking cookies for advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of significant
                            changes via email or platform notification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Contact Us</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            For privacy-related inquiries, please contact us at{' '}
                            <a href="/contact" className="text-white underline">our contact page</a>.
                        </p>
                    </section>
                </div>
            </div>

        </PublicLayout>
    );
}
