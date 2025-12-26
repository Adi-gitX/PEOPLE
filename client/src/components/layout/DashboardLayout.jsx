import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';

export function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto">
                {children}
            </main>
            <Footer />
        </div>
    );
}
