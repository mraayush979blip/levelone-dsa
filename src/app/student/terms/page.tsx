'use client';

import React from 'react';
import { Shield, Scale, FileText, CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';

export default function TermsPage() {
    const sections = [
        {
            title: "Access and Usage",
            icon: Scale,
            content: "Levelone grants you a non-exclusive, non-transferable license to access our learning modules. You agree to use the platform solely for personal, educational purposes and not for any commercial redistribution."
        },
        {
            title: "Intellectual Property",
            icon: FileText,
            content: "All course materials, including videos, source code, and design assets, are the exclusive property of Levelone. Unauthorized reproduction, screen recording, or distribution of these assets is strictly prohibited."
        },
        {
            title: "Account Security",
            icon: Shield,
            content: "You are responsible for maintaining the confidentiality of your login credentials. Any activity performed under your account is your sole responsibility. Multiple-device sharing is monitored and may lead to account suspension."
        },
        {
            title: "Student Guidelines",
            icon: Info,
            content: "We maintain a high standard of professional conduct. Spamming the AI assistant, attempting to bypass phase locks, or using offensive language in community forums will result in immediate termination of access."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-16 pb-32">
            {/* Header */}
            <header className="space-y-6">
                <Link
                    href="/student"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Return to Dashboard
                </Link>

                <SlideUp>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Scale className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Legal Framework</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
                            Terms of <span className="text-primary">Excellence.</span>
                        </h1>
                        <p className="text-muted text-lg font-medium max-w-2xl leading-relaxed">
                            At Levelone, we trade in knowledge and respect. These guidelines ensure a world-class learning environment for every engineer.
                        </p>
                    </div>
                </SlideUp>
            </header>

            {/* Core Content */}
            <StaggerContainer className="grid grid-cols-1 gap-8">
                {sections.map((section, idx) => (
                    <StaggerItem key={idx}>
                        <div className="group bg-card border border-card-border p-8 md:p-12 rounded-[2rem] shadow-sm hover:border-primary/20 transition-all duration-500">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                        <section.icon className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                                        {section.title}
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h2>
                                    <p className="text-muted leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </StaggerItem>
                ))}
            </StaggerContainer>

            {/* Final Note */}
            <FadeIn>
                <div className="bg-primary p-8 md:p-12 rounded-[2.5rem] text-white shadow-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Scale className="w-64 h-64 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Agreement</h3>
                        <p className="text-white/80 font-medium leading-relaxed max-w-xl">
                            By continuing to use our platform and accessing the curriculum, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Excellence.
                        </p>
                        <div className="pt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="bg-white/20 px-3 py-1 rounded-full">Last Updated: March 2026</span>
                            <span className="h-1 w-1 rounded-full bg-white/40" />
                            <span>v2.4.0 Stable</span>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
}
