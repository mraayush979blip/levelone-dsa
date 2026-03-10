'use client';

import React, { useState, useEffect } from 'react';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, ShoppingBag, Sparkles, LayoutDashboard, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstallPWA from '@/components/InstallPWA';
import NavigationMenu from '@/components/NavigationMenu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [localTheme, setLocalTheme] = useState<string | null>(null);

    useEffect(() => {
        // Hydrate theme from localStorage for instant, zero-flicker restoration
        const saved = localStorage.getItem('levelone-theme');
        if (saved) setLocalTheme(saved);
    }, []);

    const MobileNavLink = ({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) => (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-300",
                isActive
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
            )}
        >
            <AnimatePresence>
                {isActive && (
                    <motion.span
                        layoutId="activeTab"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-1 w-8 h-1 rounded-full bg-primary shadow-glow"
                    />
                )}
            </AnimatePresence>
            <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110 translate-y-[-2px]")} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
        </Link>
    );

    const isHelpPage = pathname === '/student/help';
    const isPhasePage = pathname?.startsWith('/student/phase/');
    const isTeamPage = pathname === '/student/team';
    const isFullscreen = isHelpPage || isPhasePage || isTeamPage;
    const currentTheme = user?.equipped_theme || localTheme || 'theme-light';

    const menuItems = [
        { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/compete', label: 'Compete', icon: Trophy },
        { href: '/student/store', label: 'Rewards', icon: ShoppingBag },
        { href: '/student/help', label: 'AI Help', icon: Sparkles },
    ];

    return (
        <ProtectedRoute requireRole="student">
            <div
                data-theme={currentTheme}
                className={cn(
                    "min-h-screen flex flex-col transition-colors duration-500 font-sans bg-background text-foreground",
                    !isFullscreen ? 'pb-20 md:pb-0' : ''
                )}
            >
                {!isFullscreen && (
                    <nav className="sticky top-0 border-b border-card-border transition-all duration-300 z-50 backdrop-blur-xl bg-card/80 relative">
                        <div className="max-w-7xl mx-auto px-6 relative z-10">
                            <div className="flex justify-between h-20">
                                <div className="flex items-center space-x-10">
                                    <Link href="/student" className="flex items-center space-x-3 group text-foreground">
                                        <div className="w-10 h-10 bg-primary rounded-xl rotate-45 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-[135deg] transition-all duration-700">
                                            <div className="-rotate-45 group-hover:-rotate-[135deg] transition-all duration-700">
                                                <Zap className="h-5 w-5 text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black tracking-[-0.05em] leading-none text-foreground">
                                                LEVELONE
                                            </span>
                                        </div>
                                    </Link>

                                    <div className="hidden md:flex items-center space-x-1">
                                        {menuItems.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative group",
                                                        isActive
                                                            ? "text-primary"
                                                            : "text-muted hover:text-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5 relative z-10">
                                                        {item.icon && <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />}
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="navGlow"
                                                            className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse"
                                                        />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="hidden lg:flex items-center gap-4 pl-8 border-l border-card-border">
                                        <div className="text-right">
                                            <p className="text-sm font-black tracking-tight truncate max-w-[150px] text-foreground">
                                                {user?.name || 'Student'}
                                            </p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-card-border bg-card transition-all hover:scale-105 active:scale-95">
                                            {user?.equipped_avatar || '👤'}
                                        </div>
                                    </div>

                                    <NavigationMenu />
                                    <InstallPWA variant="invisible" />
                                </div>
                            </div>
                        </div>
                    </nav>
                )}

                <main className={cn("flex-1", !isFullscreen ? 'py-10' : '')}>
                    {children}
                </main>

                {!isFullscreen && (
                    <>
                        <footer className="hidden md:block py-16 border-t border-card-border transition-colors mt-auto bg-card text-foreground relative overflow-hidden">
                            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary rounded-lg rotate-45 flex items-center justify-center border border-primary/20">
                                            <div className="-rotate-45">
                                                <Zap className="h-4 w-4 text-white fill-white" />
                                            </div>
                                        </div>
                                        <span className="text-lg font-black tracking-tighter">LEVELONE</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted font-medium text-xs">
                                        <span>&copy; {new Date().getFullYear()} Levelone</span>
                                        <span className="h-1 w-1 rounded-full bg-card-border" />
                                        <span>Excellence in Digital Education</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                                    <Link href="/student/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                                </div>
                            </div>
                        </footer>

                        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 z-50">
                            <div className="h-full w-full backdrop-blur-3xl rounded-t-2xl border-t border-x border-card-border shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex items-center justify-around px-4 bg-card/95 relative overflow-hidden">
                                {menuItems.map((item) => (
                                    <MobileNavLink
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label.split(' ')[0]}
                                        isActive={pathname === item.href}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
