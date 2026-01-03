import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PublicLayout({ children, showFooter = true }) {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <main className="pt-16">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
}
