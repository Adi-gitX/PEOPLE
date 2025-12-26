import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
                <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-display">
                    people
                </Link>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground/80 ml-auto mr-8">
                    <Link to="/explore" className="hover:text-white transition-colors">Missions</Link>
                    <Link to="/network" className="hover:text-white transition-colors">Network</Link>
                    <Link to="/integrations" className="hover:text-white transition-colors">Integrations</Link>
                </div>

                <div className="flex items-center space-x-6">
                    <NotificationCenter />
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
