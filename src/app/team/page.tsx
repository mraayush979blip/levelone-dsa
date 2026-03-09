'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Globe, Users, ArrowLeft, Sparkles, Code2, Palette, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';

const team = [
    {
        name: "Aayush Sharma",
        role: "Team Member",
        description: "Visionary behind Levelone's core architecture and AI systems.",
        linkedin: "https://www.linkedin.com/in/aayush-sharma-2013d",
        portfolio: "https://aayush-sharma-beige.vercel.app/",
        avatar: "⚡",
        color: "from-zinc-500 to-slate-400",
        bgImage: "/images/team/aayush.png",
        icon: Code2
    },
    {
        name: "Palak Chaurasia",
        role: "Team Member",
        description: "Crafting the visual identity and premium aesthetic of Levelone.",
        linkedin: "https://www.linkedin.com/in/palak-chaurasia-6a1388388/",
        avatar: "🎨",
        color: "from-gray-500 to-slate-300",
        bgImage: "/images/team/palak.png",
        icon: Palette
    },
    {
        name: "Kritagya Jain",
        role: "Team Member",
        description: "Ensuring the scalability and precision of our educational infrastructure.",
        linkedin: "https://www.linkedin.com/in/kritagyajain21/",
        avatar: "🛡️",
        color: "from-zinc-600 to-slate-500",
        bgImage: "/images/team/kritagya.png",
        icon: ShieldCheck
    }
];

export default function TeamPage() {
    const pathname = usePathname();
    const isStudentRoute = pathname?.startsWith('/student');
    const backHref = isStudentRoute ? '/student' : '/';
    const backLabel = isStudentRoute ? 'Back to Dashboard' : 'Back to Home';

    return (
        <div data-theme="theme-dark" className="relative min-h-screen overflow-hidden bg-background text-foreground">
            {/* Animated Space/Warp Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)] animate-pulse" />
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0.1, y: Math.random() * 1000, x: Math.random() * 2000 }}
                        animate={{
                            opacity: [0.1, 0.5, 0.1],
                            y: [null, -100 - Math.random() * 500],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute h-px w-px bg-white rounded-full shadow-[0_0_10px_white]"
                    />
                ))}
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20 relative z-10 space-y-20">
                {/* Header Section */}
                <header className="space-y-8 text-center">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary transition-all group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> {backLabel}
                    </Link>

                    <SlideUp>
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-3 text-zinc-400">
                                <Users className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Architects of Excellence</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground drop-shadow-2xl">
                                Meet <span className="text-zinc-300 italic">Our Team</span>
                            </h1>
                            <p className="text-muted text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                                A collective of visionaries, engineers, and designers dedicated to redefining the digital educational landscape.
                            </p>
                        </div>
                    </SlideUp>
                </header>

                {/* Team Grid */}
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {team.map((member) => (
                        <StaggerItem key={member.name}>
                            <motion.div
                                whileHover={{ y: -10, rotate: 1 }}
                                className="group relative h-full bg-card/40 backdrop-blur-xl border border-card-border p-8 rounded-[3rem] overflow-hidden shadow-2xl transition-all hover:bg-card/60"
                            >
                                {/* Member Background Image Overlay */}
                                {member.bgImage && (
                                    <img
                                        src={member.bgImage}
                                        alt={`${member.name} background`}
                                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none mix-blend-luminosity"
                                    />
                                )}

                                {/* Member Abstract Glow */}
                                <div className={cn(
                                    "absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br opacity-5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000 z-0",
                                    member.color
                                )} />

                                <div className="space-y-8 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="h-20 w-20 rounded-[2rem] bg-card border border-card-border flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                            {member.avatar}
                                        </div>
                                        <member.icon className="w-6 h-6 text-zinc-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight text-foreground">{member.name}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{member.role}</p>
                                        </div>
                                        <p className="text-sm text-muted font-medium leading-relaxed">
                                            {member.description}
                                        </p>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-background border border-card-border rounded-2xl text-muted hover:text-white hover:bg-white/5 transition-all shadow-sm"
                                        >
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                        {member.portfolio && (
                                            <a
                                                href={member.portfolio}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-background border border-card-border rounded-2xl text-muted hover:text-white hover:bg-white/5 transition-all shadow-sm"
                                            >
                                                <Globe className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                <FadeIn delay={0.8} className="text-center pt-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border border-card-border rounded-full shadow-2xl">
                        <Sparkles className="w-4 h-4 text-zinc-400 animate-spin-slow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Building the Future of Education • Levelone v2.4</span>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
