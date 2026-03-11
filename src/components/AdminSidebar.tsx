'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Layout,
    Layers,
    Users,
    Upload,
    LogOut,
    FileText,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import InstallPWA from './InstallPWA';

const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Layout },
    { name: 'Phases', href: '/admin/phases', icon: Layers },
    { name: 'Assignment', href: '/admin/assignment', icon: FileText },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Import CSV', href: '/admin/student-import', icon: Upload },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header Nav */}
            <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 px-4 py-4 shrink-0 shadow-sm z-30">
                <div className="flex items-center">
                    <span className="text-xl font-black text-black tracking-tighter">Levelone</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 bg-zinc-100 rounded uppercase tracking-wider">Admin</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-500 hover:text-black focus:outline-none p-1 rounded-md transition-colors">
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar content */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col w-64 glass border-r border-white/5 shrink-0",
                isOpen ? "translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "-translate-x-full"
            )}>
                <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto overflow-x-hidden">
                    <div className="flex items-center flex-shrink-0 px-8 mb-12">
                        <span className="text-2xl font-black text-white tracking-tighter uppercase text-glow">Levelone</span>
                        <span className="ml-3 px-2 py-0.5 text-[8px] font-black text-black bg-primary rounded-sm uppercase tracking-[0.3em] animate-premium-float">Core</span>
                    </div>
                    <div className="flex-1 px-4 space-y-1.5 ">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.25em] rounded-2xl transition-all relative overflow-hidden active:scale-95',
                                        isActive
                                            ? 'bg-white/5 text-primary border border-primary/10 shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.1)]'
                                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.8)]" />
                                    )}
                                    <item.icon
                                        className={cn(
                                            'mr-4 flex-shrink-0 h-4 w-4 transition-all duration-300',
                                            isActive ? 'text-primary scale-110' : 'text-zinc-600 group-hover:text-zinc-300'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="p-6 border-t border-white/5 space-y-8 bg-black/20">
                    <InstallPWA />
                    <div className="flex items-center justify-between group px-2">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none group-hover:text-primary transition-colors">{user?.name || 'ADMIN_NODE'}</p>
                            <div className="flex items-center mt-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest ml-2">Secure Link Active</span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/10 transition-all active:scale-90"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

        </>
    );
}
