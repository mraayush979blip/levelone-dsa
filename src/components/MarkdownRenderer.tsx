'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ExternalLink, Copy, Check } from 'lucide-react';

function CodeBlock({ children, className }: { children: string; className?: string }) {
    const [copied, setCopied] = React.useState(false);
    const language = className?.replace('language-', '') || '';

    const handleCopy = () => {
        navigator.clipboard.writeText(children.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-3 rounded-xl overflow-hidden border border-card-border bg-background">
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-card-border">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors"
                >
                    {copied ? (
                        <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
                    ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                    )}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                <code className="text-foreground">{children}</code>
            </pre>
        </div>
    );
}

export default function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Headings
                h1: ({ children }) => (
                    <h1 className="text-lg font-black tracking-tight text-foreground mt-4 mb-2 flex items-center gap-2">
                        <span className="h-5 w-1 bg-primary rounded-full" />
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-base font-black tracking-tight text-foreground mt-4 mb-2 flex items-center gap-2">
                        <span className="h-4 w-1 bg-primary/60 rounded-full" />
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mt-3 mb-1.5">
                        {children}
                    </h3>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <p className="text-sm text-foreground/90 leading-relaxed mb-2">{children}</p>
                ),

                // Bold & Italic
                strong: ({ children }) => (
                    <strong className="font-black text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="text-primary/80 not-italic font-semibold">{children}</em>
                ),

                // Lists
                ul: ({ children }) => (
                    <ul className="space-y-1.5 my-2 ml-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="space-y-1.5 my-2 ml-1 list-decimal list-inside">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="flex items-start gap-2 text-sm text-foreground/90">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                        <span className="leading-relaxed">{children}</span>
                    </li>
                ),

                // Code
                code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                        return <CodeBlock className={className}>{String(children)}</CodeBlock>;
                    }
                    return (
                        <code className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-xs rounded-md border border-primary/20" {...props}>
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <>{children}</>,

                // Links
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-bold underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
                    >
                        {children}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                ),

                // Blockquotes
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/30 pl-4 py-1 my-2 bg-primary/5 rounded-r-xl">
                        {children}
                    </blockquote>
                ),

                // Tables
                table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-card-border">
                        <table className="w-full text-xs">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-card border-b border-card-border">{children}</thead>
                ),
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-primary">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-3 py-2 text-sm text-foreground/80 border-b border-card-border/50">
                        {children}
                    </td>
                ),
                tr: ({ children }) => (
                    <tr className="hover:bg-primary/5 transition-colors">{children}</tr>
                ),

                // Horizontal Rule
                hr: () => (
                    <div className="my-4 flex items-center gap-2">
                        <div className="flex-1 h-px bg-card-border" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted">•</span>
                        <div className="flex-1 h-px bg-card-border" />
                    </div>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
