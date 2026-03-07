'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MessageSquare, Bug, Send, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { SlideUp, FadeIn } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';

export default function ReportPage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [type, setType] = useState<'bug' | 'review'>('review');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const phoneNumber = "6266439162";
        const text = `*Levelone ${type === 'bug' ? 'Bug Report' : 'Review'}*%0A%0A*Name:* ${name}%0A*Type:* ${type.toUpperCase()}%0A*Message:* ${message}`;

        window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-12 pb-32">
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
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Support Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            How can we <span className="text-primary">Improve?</span>
                        </h1>
                        <p className="text-muted text-base font-medium leading-relaxed">
                            Your feedback shapes the future of Levelone. Report technical issues or share your experience with us.
                        </p>
                    </div>
                </SlideUp>
            </header>

            <FadeIn>
                <form onSubmit={handleSubmit} className="bg-card border border-card-border p-8 md:p-10 rounded-[2.5rem] shadow-sm space-y-8">
                    {/* Name Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                            <UserIcon className="w-3 h-3" /> Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-background border border-card-border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                            required
                        />
                    </div>

                    {/* Toggle Switch */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                            Type of Feedback
                        </label>
                        <div className="flex p-1.5 bg-background border border-card-border rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setType('bug')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    type === 'bug' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-muted hover:text-foreground"
                                )}
                            >
                                <Bug className="w-4 h-4" /> Bug Report
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('review')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    type === 'review' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-foreground"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" /> Platform Review
                            </button>
                        </div>
                    </div>

                    {/* Message Box */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">
                            Your Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={type === 'bug' ? "Describe the issue you encountered..." : "Tell us what you like or what we can do better..."}
                            className="w-full bg-background border border-card-border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[150px] resize-none text-foreground"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-glow flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Send via WhatsApp
                    </button>
                </form>
            </FadeIn>

            <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    Instant Support Node • Connected to Levelone HQ
                </p>
            </div>
        </div>
    );
}
