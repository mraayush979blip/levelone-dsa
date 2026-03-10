'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
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
import Logo from './Logo';

const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
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
                    <div className="flex items-center flex-shrink-0 px-4 mb-8">
                        <Logo size={40} />
                        <span className="ml-3 text-xl font-black text-white tracking-tighter">Levelone</span>
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 bg-zinc-800 rounded uppercase tracking-wider">Admin</span>
                    </div>
                    <nav className="flex-1 px-2 space-y-1 bg-zinc-950">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                                        isActive
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            'mr-3 flex-shrink-0 h-5 w-5',
                                            isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex flex-col border-t border-zinc-800 p-4 space-y-4">
                    <InstallPWA />
                    <div className="flex-shrink-0 w-full group block">
                        <div className="flex items-center">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center text-xs font-medium text-zinc-400 group-hover:text-zinc-200 mt-1"
                                >
                                    <LogOut className="mr-1 h-3 w-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
