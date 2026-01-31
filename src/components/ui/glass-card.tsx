'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    onClick?: () => void;
}

export default function GlassCard({ children, className, hoverEffect = true, onClick }: GlassCardProps) {
    return (
        <motion.div
            whileHover={hoverEffect ? { scale: 1.02, y: -5 } : undefined}
            whileTap={hoverEffect ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-shadow",
                hoverEffect && "hover:shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.3)] hover:border-white/20",
                className
            )}
        >
            {/* Shine effect on hover */}
            {hoverEffect && (
                <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 opacity-0 hover:opacity-100 transition-opacity" />
            )}

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
