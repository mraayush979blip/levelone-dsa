'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Trash2,
    Sparkles,
    User,
    ChevronRight,
    Loader2,
    ArrowLeft,
    MessageSquare,
    Zap,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIHelpPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm your Levelone Learning Assistant. How can I help you optimize your studies or explain complex coding concepts today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = currentMessages
                .filter((_, index) => index > 0)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });

            const result = await response.json();

            if (result.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.text || "",
                    timestamp: new Date()
                }]);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            const errorMessage = "I'm having trouble connecting to my brain right now. Please try again in a few seconds.";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Chat history cleared. I'm ready for your next question!",
                timestamp: new Date()
            }
        ]);
    };

    return (
        <div className="flex flex-col h-screen bg-background font-sans">
            {/* Header */}
            <header className="flex-shrink-0 z-30 bg-card border-b border-card-border px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4 text-foreground">
                    <Link
                        href="/student"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-muted font-bold text-xs uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back</span>
                    </Link>
                    <div className="h-6 w-px bg-card-border mx-2" />
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-tight leading-none uppercase text-foreground">AI Learning Concierge</h1>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">High Performance Node</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearChat}
                        className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Clear conversation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {/* Chat Body */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar relative"
            >
                <div className="max-w-3xl mx-auto space-y-6">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className={cn(
                                    "flex w-full mb-2",
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div className={cn(
                                    "flex max-w-[85%] gap-4",
                                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}>
                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm",
                                        msg.role === 'user'
                                            ? 'bg-card border border-card-border text-primary'
                                            : 'bg-primary text-white'
                                    )}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "relative px-4 py-3 rounded-2xl shadow-sm leading-relaxed text-sm",
                                        msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-card border border-card-border text-foreground rounded-tl-none'
                                    )}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-center gap-4"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Input Footer */}
            <footer className="flex-shrink-0 p-6 bg-card border-t border-card-border z-30">
                <div className="max-w-3xl mx-auto">
                    <form
                        onSubmit={handleSendMessage}
                        className="relative group flex items-center gap-3 bg-card p-1.5 rounded-2xl border border-card-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-inner"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none !px-4 !py-3 !shadow-none !ring-0 text-sm focus:outline-none placeholder:text-muted/50 text-foreground"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-primary hover:bg-primary/90 disabled:bg-card border border-transparent disabled:border-card-border text-white rounded-xl transition-all shadow-glow active:scale-95 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </button>
                    </form>
                    <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <Shield className="h-3 w-3" /> Encrypted Session
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Zap className="h-3 w-3" /> Instant Response
                            </span>
                        </div>
                        <p>Built for Excellence • Levelone v2.0</p>
                    </div>
                </div>
            </footer >

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}</style>
        </div >
    );
}
