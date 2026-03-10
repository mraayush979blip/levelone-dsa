'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, X, Zap, Check } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallPWAProps {
    variant?: 'header' | 'menu' | 'invisible';
}

export default function InstallPWA({ variant = 'header' }: InstallPWAProps) {
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const [mounted, setMounted] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [showDesktopGuide, setShowDesktopGuide] = useState(false);

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

    useEffect(() => {
        setMounted(true);

        const timer = setTimeout(() => {
            if (variant !== 'invisible') return;
            const hasPopupShown = sessionStorage.getItem('pwa_popup_shown');
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

            if (!hasPopupShown && !isInstalled) {
                setShowInstallModal(true);
                sessionStorage.setItem('pwa_popup_shown', 'true');
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [variant]);

    if (!mounted) return null;

    const renderModalContent = () => (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-sm rounded-[2.5rem] border border-card-border shadow-2xl p-8 relative overflow-hidden"
        >
            <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all z-10 border border-red-500/20 shadow-sm"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20 shadow-glow">
                    {isStandalone ? <Sparkles className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
                </div>
                <h2 className="text-2xl font-black tracking-tight">{isStandalone ? 'Update Levelone' : 'Install Levelone'}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">
                    {isStandalone ? 'Sync to the latest version' : 'Supercharge your experience'}
                </p>
            </div>

            {!isStandalone ? (
                <div className="space-y-4 mb-8 bg-background border border-card-border rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                        <div>
                            <p className="text-xs font-bold">Lightning Fast</p>
                            <p className="text-[10px] text-muted">Bypasses browser overhead for instant loading</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                        <div>
                            <p className="text-xs font-bold">Native Experience</p>
                            <p className="text-[10px] text-muted">Runs standalone without URL bars or distractions</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                        <div>
                            <p className="text-xs font-bold">Offline Resilience</p>
                            <p className="text-[10px] text-muted">Advanced caching for poor network conditions</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-sm text-muted mb-8 px-4 leading-relaxed">
                    You already have the premium Levelone app installed! If you feel like your app is out of date or experiencing bugs, click below to force a core engine update.
                </div>
            )}

            {isStandalone ? (
                <button
                    onClick={async () => {
                        if (confirm('Verify: Update Levelone Node? This will reload the app.')) {
                            localStorage.clear();
                            if ('serviceWorker' in navigator) {
                                const regs = await navigator.serviceWorker.getRegistrations();
                                for (const reg of regs) await reg.unregister();
                            }
                            const cacheNames = await caches.keys();
                            for (const name of cacheNames) await caches.delete(name);
                            window.location.reload();
                        }
                    }}
                    className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-all shadow-glow hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                    <Sparkles className="h-4 w-4" /> Force Core Update
                </button>
            ) : (
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            handleInstallClick();
                            setTimeout(() => {
                                if (!isInstallable && isIOS) {
                                    setShowIOSGuide(true);
                                } else if (!isInstallable) {
                                    setShowDesktopGuide(true);
                                } else {
                                    setShowInstallModal(false);
                                }
                            }, 500);
                        }}
                        className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-all shadow-glow hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download className="h-4 w-4" /> {isIOS ? 'Show iOS Install Steps' : 'Install PWA Native Engine'}
                    </button>

                    <AnimatePresence>
                        {showDesktopGuide && !isIOS && !isInstallable && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 text-left">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Install Options Missing?</p>
                                    <div className="text-[10px] text-muted font-medium leading-relaxed">
                                        Your browser blocked the automatic popup. Look for the <strong>Install App</strong> or <strong>App Available</strong> icon in the browser's URL bar.
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {showIOSGuide && isIOS && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 text-left">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Apple iOS Device Detected</p>
                                    <ol className="text-[10px] text-muted font-medium space-y-2 list-decimal list-inside leading-relaxed">
                                        <li>Tap the <strong className="text-foreground">Share</strong> icon (□↑) at the bottom</li>
                                        <li>Scroll down and select <strong className="text-foreground">"Add to Home Screen"</strong></li>
                                    </ol>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );

    const ModalPortal = () => (
        mounted && typeof document !== 'undefined' ? createPortal(
            <AnimatePresence>
                {showInstallModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-6"
                    >
                        {renderModalContent()}
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        ) : null
    );

    if (variant === 'invisible') {
        return <ModalPortal />;
    }

    return (
        <>
            {variant === 'menu' ? (
                <button
                    onClick={() => setShowInstallModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group mt-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                            {isStandalone ? (
                                <Sparkles className="h-4 w-4 text-primary" />
                            ) : (
                                <Download className="h-4 w-4 text-primary group-hover:animate-bounce" />
                            )}
                        </div>
                        <span className="text-xs font-bold tracking-tight uppercase">
                            {isStandalone ? 'Update App' : 'Install App'}
                        </span>
                    </div>
                </button>
            ) : (
                <button
                    onClick={() => setShowInstallModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-card border border-card-border hover:bg-primary/10 hover:border-primary/30 text-muted hover:text-primary text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 group"
                    title={isStandalone ? "Update Levelone App" : "Install Levelone App"}
                >
                    {isStandalone ? (
                        <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                        <Download className="h-4 w-4 group-hover:animate-bounce" />
                    )}
                    <span className="hidden sm:inline">{isStandalone ? 'Update App' : 'Install App'}</span>
                </button>
            )}
            <ModalPortal />
        </>
    );
}
