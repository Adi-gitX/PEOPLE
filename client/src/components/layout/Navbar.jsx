import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                    people
                </Link>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
                    <Link to="#philosophy" className="hover:text-white transition-colors">Philosophy</Link>
                    <Link to="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
                    <Link to="#manifesto" className="hover:text-white transition-colors">Manifesto</Link>
                </div>

                <div className="flex items-center space-x-4">
                    <Link to="/login" className="text-sm font-medium text-white hover:text-white/80 transition-colors hidden sm:block">
                        Log In
                    </Link>
                    <Link to="/signup">
                        <Button size="sm" className="font-semibold">Sign Up</Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
