import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
                <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-display">
                    people
                </Link>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground/80 ml-auto mr-8">
                    <Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                    <Link to="/integrations" className="hover:text-white transition-colors">Integrations</Link>
                    <Link to="/developers" className="hover:text-white transition-colors">Developers</Link>
                    <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                </div>

                <div className="flex items-center space-x-4">
                    <Link to="/signup">
                        <Button size="sm" className="bg-white text-black hover:bg-white/90 font-semibold px-5 rounded-none h-9">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
