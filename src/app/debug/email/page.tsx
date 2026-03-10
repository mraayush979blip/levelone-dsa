'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, Zap } from 'lucide-react';
import { sendEmailNotification } from '@/actions/sendEmail';

export default function EmailTestPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    const handleTestSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setError('');
        setResult(null);

        const testPayload = {
            phaseData: {
                phase_number: 99,
                title: "Brevo SMTP Engine Test",
                description: "This is a premium automated test email from the Levelone diagnostic tool to verify your Brevo configuration."
            },
            students: [
                { email, name: name || 'Valued Tester' }
            ]
        };

        try {
            const res = await sendEmailNotification(testPayload);
            if (res.success) {
                setStatus('success');
                setResult(res);
            } else {
                setStatus('error');
                setError(res.error || 'SMTP Connection Failed');
            }
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'System Crash');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-card-border rounded-[2.5rem] shadow-2xl p-8 space-y-8 relative overflow-hidden">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20 shadow-glow">
                            <Mail className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Email Engine</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Brevo SMTP Diagnostic Tool</p>
                    </div>

                    <form onSubmit={handleTestSend} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Target Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-background border border-card-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Target Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tester@example.com"
                                    className="w-full bg-background border border-card-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/50"
                                />
                            </div>
                        </div>

                        <button
                            disabled={status === 'loading'}
                            className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Establishing SMTP...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    <span>Fire Test Email</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Status Feedback */}
                    <div className="pt-2">
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-4"
                            >
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Connection Live</p>
                                    <p className="text-[10px] text-muted leading-relaxed font-medium">
                                        Brevo Relay accepted your credentials. Check your inbox (and spam folder) for the test payload.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4"
                            >
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-red-500 uppercase tracking-widest">Engine Failure</p>
                                    <p className="text-[10px] text-muted leading-relaxed font-medium break-words">
                                        {error}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-6 opacity-30 grayscale">
                        <Zap className="h-4 w-4" />
                        <Sparkles className="h-4 w-4" />
                        <div className="text-[8px] font-black uppercase tracking-[0.3em]">Brevo Cloud V3</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[9px] font-medium text-muted/60 max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest">
                        This tool bypasses client-side restrictions and communicates directly with the Brevo SMTP Relay.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
