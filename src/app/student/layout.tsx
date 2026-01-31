'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, BookOpen, Trophy, ShoppingBag, Terminal, User as UserIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstallPWA from '@/components/InstallPWA';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const MobileNavLink = ({ href, icon: Icon, label, isActive, isNeon }: { href: string; icon: any; label: string; isActive: boolean; isNeon: boolean }) => (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-300",
                isActive
                    ? (isNeon ? "text-indigo-400" : "text-indigo-600")
                    : "text-slate-400 hover:text-slate-600"
            )}
        >
            {isActive && (
                <motion.span
                    layoutId="activeTab"
                    className={cn("absolute top-0 w-8 h-1 rounded-full", isNeon ? "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" : "bg-indigo-600")}
                />
            )}
            <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </Link>
    );

    const isHelpPage = pathname === '/student/help';
    const isPhasePage = pathname?.startsWith('/student/phase/');
    const isNeon = user?.equipped_theme === 'theme-neon';

    return (
        <ProtectedRoute requireRole="student">
            <div
                className={cn(
                    "min-h-screen flex flex-col transition-colors duration-500",
                    !isHelpPage && !isPhasePage ? 'pb-24 md:pb-0' : '',
                    isNeon ? "bg-gray-950 text-white" : "bg-white text-slate-900"
                )}
            >
                {!isHelpPage && (
                    <nav className={cn(
                        "sticky top-0 border-b transition-all relative z-50 backdrop-blur-xl",
                        isNeon ? "bg-gray-950/80 border-white/5" : "bg-white/80 border-slate-100"
                    )}>
                        <div className="max-w-6xl mx-auto px-6">
                            <div className="flex justify-between h-20">
                                <div className="flex items-center space-x-12">
                                    <Link href="/student" className="flex items-center space-x-3 group">
                                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                            <BookOpen className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-xl font-black tracking-tight tracking-[-0.04em]">
                                            Levelone
                                        </span>
                                    </Link>

                                    <div className="hidden md:flex items-center space-x-1">
                                        {[
                                            { href: '/student', label: 'Dashboard', icon: null },
                                            { href: '/student/compete', label: 'Compete', icon: Trophy },
                                            { href: '/student/store', label: 'Rewards', icon: ShoppingBag },
                                            { href: '/student/help', label: 'Help AI', icon: Terminal },
                                        ].map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    pathname === item.href
                                                        ? (isNeon ? "bg-white/5 text-indigo-400" : "bg-indigo-50 text-indigo-600")
                                                        : (isNeon ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {item.icon && <item.icon className="h-3.5 w-3.5" />}
                                                    {item.label}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <InstallPWA />

                                    <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-slate-100 dark:border-white/5">
                                        <div className="text-right">
                                            <p className="text-sm font-bold truncate max-w-[120px]">
                                                {user?.name?.split(' ')[0] || 'Student'}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-80">
                                                {user?.role}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center text-xl shadow-sm border",
                                            isNeon ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"
                                        )}>
                                            {user?.equipped_avatar || '👤'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => signOut()}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}

                <main className={cn("flex-1", !isHelpPage && !isPhasePage ? 'py-8' : '')}>
                    {children}
                </main>

                {!isHelpPage && !isPhasePage && (
                    <>
                        <footer className={cn(
                            "hidden md:block py-12 border-t transition-colors",
                            isNeon ? "bg-gray-950 border-white/5" : "bg-white border-slate-100"
                        )}>
                            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                    <span>&copy; {new Date().getFullYear()} Levelone</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <span>Built for Excellence</span>
                                </div>
                                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <Link href="#" className="hover:text-indigo-500 transition-colors">Privacy</Link>
                                    <Link href="#" className="hover:text-indigo-500 transition-colors">Terms</Link>
                                    <Link href="#" className="hover:text-indigo-500 transition-colors">Support</Link>
                                </div>
                            </div>
                        </footer>

                        {/* Mobile Navigation - Floated Minimalist */}
                        <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 z-50">
                            <div className={cn(
                                "h-full w-full backdrop-blur-2xl rounded-3xl border shadow-2xl flex items-center justify-around px-2",
                                isNeon ? "bg-gray-950/80 border-white/10" : "bg-white/90 border-slate-100 shadow-slate-200/50"
                            )}>
                                <MobileNavLink href="/student" icon={BookOpen} label="Learn" isActive={pathname === '/student'} isNeon={isNeon} />
                                <MobileNavLink href="/student/compete" icon={Trophy} label="Compete" isActive={pathname === '/student/compete'} isNeon={isNeon} />
                                <MobileNavLink href="/student/store" icon={ShoppingBag} label="Store" isActive={pathname === '/student/store'} isNeon={isNeon} />
                                <MobileNavLink href="/student/help" icon={Terminal} label="AI Help" isActive={pathname === '/student/help'} isNeon={isNeon} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
