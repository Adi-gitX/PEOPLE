import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    const socialLinks = [
        { href: import.meta.env.VITE_SOCIAL_GITHUB, icon: Github, label: 'GitHub' },
        { href: import.meta.env.VITE_SOCIAL_X, icon: Twitter, label: 'X' },
        { href: import.meta.env.VITE_SOCIAL_LINKEDIN, icon: Linkedin, label: 'LinkedIn' },
    ].filter((item) => Boolean(item.href));

    return (
        <footer className="border-t border-white/10 bg-black py-20">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
                <div>
                    <h4 className="font-bold text-white mb-6 text-sm">Product</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground/60 font-medium">
                        <li><Link to="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                        <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        <li><Link to="/workflows" className="hover:text-white transition-colors">Workflows</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-sm">Developers</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground/60 font-medium">
                        <li><Link to="/developers" className="hover:text-white transition-colors">Developer Platform</Link></li>
                        <li><Link to="/waitlist" className="hover:text-white transition-colors">Join Waitlist</Link></li>
                        <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-sm">Company</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground/60 font-medium">
                        <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                        <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                        <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                        <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-sm">Legal</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground/60 font-medium">
                        <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-xs text-muted-foreground/40">
                    © 2026 PEOPLE.
                </div>
                {socialLinks.length > 0 && (
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social) => {
                            const SocialIcon = social.icon;

                            return (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground/40 hover:text-white transition-colors"
                                    aria-label={social.label}
                                >
                                    <SocialIcon className="w-5 h-5" />
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </footer>
    );
}
