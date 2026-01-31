'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, Check, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface GiftUnboxingProps {
    userId: string;
    userName: string;
    onUnlock: () => void;
    onClose: () => void;
}

export default function GiftUnboxing({ userId, userName, onUnlock, onClose }: GiftUnboxingProps) {
    const [stage, setStage] = useState<'closed' | 'open' | 'claimed'>('closed');
    const [loading, setLoading] = useState(false);

    const handleOpen = () => {
        setStage('open');
        // Fire minimalist confetti
        const end = Date.now() + 2000;
        const colors = ['#6366f1', '#a855f7', '#ec4899'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors
            });

            if (Date.now() < end) requestAnimationFrame(frame);
        })();
    };

    const handleClaim = async () => {
        if (loading) return;
        setLoading(true);
        console.log('🎁 Attempting to equip theme for user:', userId);

        try {
            // Updated to ensure exact column update - matching the new RLS policy
            const { error } = await supabase
                .from('users')
                .update({ equipped_theme: 'theme-neon' })
                .eq('id', userId);

            if (error) {
                console.error('❌ Supabase update error:', error);
                throw error;
            }

            console.log('✅ Theme equipped successfully in database');
            setStage('claimed');
            toast.success('Neon Mode Activated!');

            // Subtle delay for visual feedback
            setTimeout(() => {
                onUnlock();
            }, 1200);

        } catch (err: any) {
            console.error('❌ Error unlocking theme:', err);
            toast.error(err.message || 'Failed to equip theme. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4"
            >
                <div className="max-w-sm w-full relative">
                    {/* Minimal Close */}
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <motion.div
                        layout
                        className="bg-gray-900/50 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl relative overflow-hidden"
                    >
                        <h2 className="text-xl font-medium text-white mb-2 relative z-10 tracking-tight">
                            {stage === 'closed' ? `Hey ${userName}!` : stage === 'open' ? 'Legacy Reward' : 'Done!'}
                        </h2>

                        <p className="text-sm text-gray-400 mb-8 relative z-10 font-light">
                            {stage === 'closed'
                                ? "You've unlocked a special gift for your consistency."
                                : stage === 'open'
                                    ? "The 'Neon Cyberpunk' theme is now yours."
                                    : "Activating your new dashboard..."}
                        </p>

                        <div className="relative z-10 mb-8">
                            {stage === 'closed' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleOpen}
                                    className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-indigo-500/20 shadow-xl group"
                                >
                                    <Gift className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" />
                                </motion.button>
                            )}

                            {stage === 'open' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full aspect-[16/10] bg-gray-950 rounded-2xl border border-white/5 overflow-hidden relative flex items-center justify-center bg-[url('/grid.svg')] bg-[length:20px_20px] bg-center opacity-50"
                                >
                                    <div className="text-center z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-2">
                                            <Sparkles className="w-3 h-3" /> Exclusive
                                        </div>
                                        <h3 className="text-lg font-bold text-white tracking-widest italic translate-y-1">NEON MODE</h3>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                                </motion.div>
                            )}

                            {stage === 'claimed' && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-10 h-10 text-emerald-500" />
                                </motion.div>
                            )}
                        </div>

                        {stage === 'open' && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleClaim}
                                disabled={loading}
                                className="w-full py-4 bg-white text-gray-950 font-bold text-sm rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all relative z-10 disabled:opacity-50"
                            >
                                {loading ? 'EQUIPPING...' : 'EQUIP NEON THEME'}
                            </motion.button>
                        )}

                        {stage === 'closed' && (
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">Tap to reveal</p>
                        )}
                    </motion.div>

                    {/* Background Detail */}
                    <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
