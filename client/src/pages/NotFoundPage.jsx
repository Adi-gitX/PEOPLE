import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';

export default function NotFoundPage() {
    return (
        <PublicLayout>
            <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-8rem)]">
                <div className="relative">
                    <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 rounded-full" />

                    <div className="relative text-center z-10">
                        <div className="mb-8">
                            <h1 className="text-[150px] font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
                                404
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-zinc-400">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-lg">Page not found</span>
                            </div>
                        </div>

                        <p className="text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
                            The page you are looking for does not exist or has been moved.
                            Let us get you back on track.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/"
                                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 px-6 py-3 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go Back
                            </button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-zinc-800">
                            <p className="text-sm text-zinc-500 mb-4">Looking for something specific?</p>
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                                <Link to="/explore" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                                    <Search className="w-4 h-4" />
                                    Explore Missions
                                </Link>
                                <Link to="/network" className="text-zinc-400 hover:text-white transition-colors">
                                    Browse Network
                                </Link>
                                <Link to="/faq" className="text-zinc-400 hover:text-white transition-colors">
                                    FAQ
                                </Link>
                                <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors">
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
