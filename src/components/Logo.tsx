'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

export default function Logo({ className, size = 40, showText = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className="relative flex items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden border border-zinc-200/50"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size * 0.7}
                    height={size * 0.7}
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="l1-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#0f172a" /> {/* Slate 900 / Dark Blue */}
                            <stop offset="40%" stopColor="#1e40af" /> {/* Blue 800 */}
                            <stop offset="100%" stopColor="#10b981" /> {/* Emerald 500 */}
                        </linearGradient>
                    </defs>

                    {/* The L-Arrow */}
                    <path
                        d="M10 32H24"
                        stroke="url(#l1-gradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M10 32V8M10 8L5 13M10 8L15 13"
                        stroke="url(#l1-gradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* The 1 */}
                    <path
                        d="M32 8V32M32 8L28 12"
                        stroke="url(#l1-gradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {showText && (
                <span className="text-xl font-black tracking-[-0.05em] leading-none text-foreground uppercase">
                    Levelone
                </span>
            )}
        </div>
    );
}
