'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to handle PWA installation.
 * Captures the 'beforeinstallprompt' event and provides a function to trigger the install dialog.
 */
export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Hydrate from global prompt if already captured by head script
        if (typeof window !== 'undefined' && (window as any).deferredPrompt) {
            setInstallPrompt((window as any).deferredPrompt);
            setIsInstallable(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
            (window as any).deferredPrompt = e;
            console.log('PWA: Install prompt captured via listener');
        };

        const customHandler = () => {
            if ((window as any).deferredPrompt) {
                setInstallPrompt((window as any).deferredPrompt);
                setIsInstallable(true);
                console.log('PWA: Install prompt captured via custom event');
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwa-prompt-captured', customHandler);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('pwa-prompt-captured', customHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        const prompt = installPrompt || (window as any).deferredPrompt;
        if (!prompt) return;

        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(`PWA: User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            setInstallPrompt(null);
            (window as any).deferredPrompt = null;
            setIsInstallable(false);
        }
    };

    return { isInstallable, handleInstallClick };
}
