'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, Maximize, Settings, Volume2 } from 'lucide-react';

interface PremiumPlayerProps {
    videoId: string;
    onComplete?: () => void;
}

export default function PremiumPlayer({ videoId, onComplete }: PremiumPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="relative group aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 ring-1 ring-white/5">
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 cursor-pointer overflow-hidden"
                        onClick={() => setIsPlaying(true)}
                    >
                        {/* Background Thumbnail with Blur Effect */}
                        <Image
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt="Premium Preview"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            unoptimized
                        />

                        {/* Glassmorphic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.3)] group-hover:bg-blue-600/20 group-hover:border-blue-400/50 transition-all duration-500"
                            >
                                <div className="ml-2">
                                    <Play className="h-10 w-10 text-white fill-white" />
                                </div>
                            </motion.div>
                        </div>

                        {/* Video Info Badge */}
                        <div className="absolute top-6 left-6 flex items-center space-x-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75" />
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-150" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Premium Session</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isPlaying && (
                <div className="w-full h-full">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                <Loader2 className="h-12 w-12 text-blue-500 animate-spin relative" />
                            </div>
                        </div>
                    )}
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1`}
                        onLoad={() => setIsLoading(false)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full scale-[1.01]" // Hide tiny edge gaps
                    ></iframe>
                </div>
            )}

            {/* Futuristic Controller Bar (Visual Only for Aesthetics) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-full bg-blue-500 w-1/3 shadow-[0_0_10px_#3b82f6]" />
            </div>

            <div className="absolute bottom-4 right-4 flex space-x-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <div className="p-2 bg-black/50 backdrop-blur-lg rounded-lg border border-white/10">
                    <Volume2 className="h-4 w-4 text-white/70" />
                </div>
                <div className="p-2 bg-black/50 backdrop-blur-lg rounded-lg border border-white/10">
                    <Maximize className="h-4 w-4 text-white/70" />
                </div>
            </div>
        </div>
    );
}
