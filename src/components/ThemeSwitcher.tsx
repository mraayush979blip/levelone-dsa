'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Moon, Sun, Monitor, Pipette, Zap, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const themes = [
    { id: 'theme-light', name: 'Premium Ivory', icon: Sun, color: '#0f172a' },
    { id: 'theme-dark', name: 'Midnight Pro', icon: Zap, color: '#f59e0b' }
];

export default function ThemeSwitcher() {
    const { user, updateTheme } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentTheme = user?.equipped_theme || 'theme-indigo';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-600/30 transition-all active:scale-95 group"
                title="Change Theme"
            >
                <Palette className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                        >
                            <div className="px-3 py-2 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Interface Theme</p>
                            </div>
                            <div className="space-y-1">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={async () => {
                                            try {
                                                await updateTheme(t.id);
                                                setIsOpen(false);
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                                            currentTheme === t.id
                                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}44` }}
                                            />
                                            <span className="text-xs font-bold tracking-tight">{t.name}</span>
                                        </div>
                                        {currentTheme === t.id && (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
