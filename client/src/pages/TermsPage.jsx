import { PublicLayout } from '../components/layout/PublicLayout';

export default function TermsPage() {
    return (
        <PublicLayout>
            <div className="flex-1 py-16 px-6 max-w-4xl mx-auto w-full min-h-[calc(100vh-4rem)]">
                <h1 className="text-4xl font-bold tracking-tighter mb-8">Terms of Service</h1>
                <p className="text-sm text-zinc-500 mb-8">Last updated: January 2, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            By accessing or using the PEOPLE platform ("Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            PEOPLE is a talent-matching platform that connects Initiators (clients) with Contributors (freelancers/builders)
                            for various missions and projects. We provide tools for mission posting, application management, messaging,
                            and payment processing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li>You must provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the security of your account credentials.</li>
                            <li>You must be at least 18 years old to use this Service.</li>
                            <li>One person may only maintain one account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Platform Rules</h2>
                        <ul className="text-zinc-400 leading-relaxed list-disc pl-6 space-y-2">
                            <li>Do not submit false or misleading information in profiles or applications.</li>
                            <li>Respect all intellectual property rights of others.</li>
                            <li>No harassment, discrimination, or abusive behavior.</li>
                            <li>All payments must go through the platform's escrow system.</li>
                            <li>Do not attempt to circumvent platform fees.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Payments & Escrow</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            PEOPLE uses an escrow system to protect both Initiators and Contributors. Funds are held in escrow
                            until mission completion is approved. Disputes are handled by our admin team. A platform fee applies
                            to all successful transactions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            PEOPLE is not responsible for the quality of work delivered by Contributors or the conduct of Initiators.
                            We are a platform facilitator and do not guarantee successful project outcomes. Our liability is limited
                            to the fees paid to the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Termination</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their
                            accounts at any time, subject to any pending obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Contact</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            For questions about these Terms, please contact us at{' '}
                            <a href="/contact" className="text-white underline">our contact page</a>.
                        </p>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}
