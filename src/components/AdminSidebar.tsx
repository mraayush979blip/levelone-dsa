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
            <div className="md:hidden flex items-center justify-between bg-black border-b border-zinc-800 px-4 py-4 shrink-0 shadow-sm z-30">
                <div className="flex items-center">
                    <span className="text-xl font-black text-white tracking-tighter">Levelone</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 bg-zinc-800 rounded uppercase tracking-wider">Admin</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white focus:outline-none p-1 rounded-md transition-colors">
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
                "fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 shrink-0",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-6 mb-10">
                        <span className="text-xl font-black text-white tracking-tighter uppercase">Levelone</span>
                        <span className="ml-3 px-2 py-1 text-[9px] font-black text-black bg-white rounded-md uppercase tracking-[0.2em]">Core</span>
                    </div>
                    <div className="flex-1 px-4 space-y-2 bg-zinc-950">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all relative overflow-hidden',
                                        isActive
                                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95'
                                            : 'text-zinc-500 hover:text-white hover:bg-zinc-900 active:scale-95'
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            'mr-3 flex-shrink-0 h-4 w-4 transition-colors',
                                            isActive ? 'text-black' : 'text-zinc-600 group-hover:text-white'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="p-6 border-t border-zinc-900 space-y-6">
                    <InstallPWA />
                    <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{user?.name || 'ADMIN_NODE'}</p>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Status: Online</span>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5 transition-all active:scale-95"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
