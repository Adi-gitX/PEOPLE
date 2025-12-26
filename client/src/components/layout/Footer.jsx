import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">people</h3>
                    <p className="text-sm text-muted-foreground">
                        A mission-based collaboration platform.
                        <br />
                        Solving real problems with high-quality teams.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-sm">Platform</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link to="#" className="hover:text-white transition-colors">Missions</Link></li>
                        <li><Link to="#" className="hover:text-white transition-colors">Teams</Link></li>
                        <li><Link to="#" className="hover:text-white transition-colors">Outcomes</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-sm">Company</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link to="#" className="hover:text-white transition-colors">About</Link></li>
                        <li><Link to="#" className="hover:text-white transition-colors">Philosophy</Link></li>
                        <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-sm">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link to="#" className="hover:text-white transition-colors">Privacy</Link></li>
                        <li><Link to="#" className="hover:text-white transition-colors">Terms</Link></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} people. All rights reserved.
            </div>
        </footer>
    );
}
