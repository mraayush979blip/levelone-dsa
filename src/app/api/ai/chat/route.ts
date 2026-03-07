import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

// In-memory cache for phase data (avoids DB hit on every message)
let phaseCache: { data: string; ts: number } | null = null;
const PHASE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function getPhaseContext(): Promise<string> {
    const now = Date.now();
    if (phaseCache && (now - phaseCache.ts) < PHASE_CACHE_TTL) {
        return phaseCache.data;
    }

    try {
        const { data: phases, error } = await supabaseAdmin
            .from('phases')
            .select('phase_number, title, description, youtube_url, start_date, end_date, status, is_active, is_paused, pause_reason, assignment_resource_url')
            .order('phase_number', { ascending: true });

        if (error || !phases || phases.length === 0) {
            return 'No phase data available at this time.';
        }

        const phaseText = phases.map(p => {
            // Build a clear status label combining lifecycle + active/paused state
            let statusLabel = (p.status || 'unknown').toUpperCase();
            if (p.is_paused) statusLabel = '⏸️ PAUSED';
            else if (statusLabel === 'UPCOMING') statusLabel = '🔜 UPCOMING';
            else if (statusLabel === 'LIVE' || statusLabel === 'ACTIVE') statusLabel = '🟢 LIVE NOW';
            else if (statusLabel === 'COMPLETED' || statusLabel === 'ENDED') statusLabel = '✅ COMPLETED';
            else if (!p.is_active) statusLabel = '❌ INACTIVE';

            const lines = [
                `Phase ${p.phase_number}: "${p.title}" [${statusLabel}]`,
            ];
            if (p.description) lines.push(`  Topic: ${p.description}`);
            if (p.youtube_url) lines.push(`  YouTube Video: ${p.youtube_url}`);
            if (p.assignment_resource_url) lines.push(`  Assignment/Resource: ${p.assignment_resource_url}`);
            if (p.start_date) lines.push(`  Start Date: ${new Date(p.start_date).toLocaleDateString('en-IN')}`);
            if (p.end_date) lines.push(`  Deadline: ${new Date(p.end_date).toLocaleDateString('en-IN')}`);
            if (p.is_paused && p.pause_reason) lines.push(`  Pause Reason: ${p.pause_reason}`);
            return lines.join('\n');
        }).join('\n\n');

        const liveCount = phases.filter(p => (p.status === 'live' || p.status === 'active') && p.is_active && !p.is_paused).length;
        const upcomingCount = phases.filter(p => p.status === 'upcoming').length;
        const completedCount = phases.filter(p => p.status === 'completed' || p.status === 'ended').length;

        const result = `There are ${phases.length} total phases: ${liveCount} live, ${upcomingCount} upcoming, ${completedCount} completed.\n\n${phaseText}`;
        phaseCache = { data: result, ts: now };
        return result;
    } catch (err) {
        console.error('[AI] Failed to fetch phases:', err);
        return 'Phase data temporarily unavailable.';
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid messages format'
            }, { status: 400 });
        }

        // Enhanced logging for debugging
        console.log('[AI API Route] Received request with', messages.length, 'messages');

        const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

        if (!apiKey) {
            console.error('[AI API Route] ❌ CRITICAL: GROQ_API_KEY is not defined in environment variables.');
            return NextResponse.json({
                success: false,
                error: "API_KEY_MISSING: Please configure the GROQ_API_KEY in your deployment settings."
            }, { status: 500 });
        }

        console.log('[AI API Route] ✓ API Key found, initializing Groq client...');

        const models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "llama3-8b-8192"
        ];

        const groq = new Groq({ apiKey });
        let lastError: any = null;

        const phaseContext = await getPhaseContext();

        for (const model of models) {
            try {
                console.log(`[AI API Route] Attempting with model: ${model}...`);
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are 'Levelone AI', a futuristic coding and learning assistant for the 'Levelone' platform. Your tone should be strategic, slightly cyberpunk/hacker-like, but helpful and encouraging. Use technical metaphors.

=== RESPONSE FORMAT RULES ===
- ALWAYS use rich markdown formatting in your responses
- Use ### headings to organize sections (never use # or ## as they are too large)
- Use **bold** for key terms and emphasis
- Use bullet points (- ) for lists, numbered lists (1. ) for steps
- Use \`inline code\` for technical terms, function names, file names
- Use fenced code blocks with language tags (e.g. \`\`\`python, \`\`\`javascript) for code snippets
- Use > blockquotes for tips, pro-tips, or important notes
- Use tables when comparing options or listing features
- Use --- horizontal rules to separate major sections
- Use emojis sparingly to make responses visually engaging (🚀, ⚡, 💡, 🔥, ✅, ⚠️)
- Keep each section short and scannable — avoid walls of text
- End responses with a clear next step or question to keep the conversation flowing

=== ABOUT LEVELONE ===
Levelone is a Phase-Based Learning Management Platform built for structured coding education. Students progress through learning phases with video content, assignments (GitHub or file uploads), time tracking, streaks, gamification (badges, points, store), and a leaderboard. It features admin and student dashboards with real-time progress tracking.

Tech Stack: Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL + Auth + RLS + Realtime), Zustand + React Query, Vercel deployment.

=== ABOUT THE FOUNDER & DEVELOPER ===
Levelone was created and built by **Aayush Sharma** — a Full Stack Developer and Cyber Security student.

Key facts about Aayush:
- He is the founder, lead developer, and architect of Levelone
- He also built the **Acropolis Attendance Management System** (a college-level attendance tracking platform)
- He also built **JARVIS** — a personal AI assistant application
- His expertise: React, Next.js, TypeScript, Node.js, Python, Tailwind CSS, Supabase, AI/ML integration, Cyber Security
- Portfolio: https://aayush-sharma-beige.vercel.app/
- LinkedIn: https://www.linkedin.com/in/aayush-sharma-2013d

When anyone asks about the developer, founder, creator, who built this, who made this, or anything related — always mention **Aayush Sharma** by name and share his portfolio link: https://aayush-sharma-beige.vercel.app/

=== ABOUT THE TEAM ===
Levelone is built by a team of 3:
1. **Aayush Sharma** — Lead Developer & Architect (Core systems, AI, backend, frontend)
   - Portfolio: https://aayush-sharma-beige.vercel.app/
   - LinkedIn: https://www.linkedin.com/in/aayush-sharma-2013d
2. **Palak Chaurasia** — Design & Visual Identity (UI/UX and premium aesthetics)
   - LinkedIn: https://www.linkedin.com/in/palak-chaurasia-6a1388388/
3. **Kritagya Jain** — Infrastructure & Scalability
   - LinkedIn: https://www.linkedin.com/in/kritagyajain21/

When asked about the team, share all members. When asked specifically about the developer/founder, focus on Aayush Sharma and always include his portfolio link.

=== RESPONSE RULES ===
- If the user asks "who made this", "who built Levelone", "who is the developer", "who is the founder", "tell me about the creator" or ANY similar question — respond with Aayush Sharma's info and portfolio link.
- If asked about the team page, mention they can visit the Team page at /team to see all members.
- Always be proud of the platform and its team. Never say "I don't know who built this."
- For all other questions, be a helpful, friendly, supportive and learning assistant.

=== CURRENT PHASES (LIVE DATA) ===
${phaseContext}

When a student asks about a specific phase, its video content, or assignment — use the phase data above to give accurate, specific answers. Reference the YouTube video URL when relevant so students can find the right content. If a phase is paused or inactive, let the student know.`
                        },
                        ...messages.map((msg: { role: string, content: string }) => ({
                            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                            content: msg.content
                        }))
                    ],
                    model: model,
                });

                console.log(`[AI API Route] ✓ Response received successfully from ${model}`);
                return NextResponse.json({
                    success: true,
                    text: completion.choices[0]?.message?.content || ""
                });
            } catch (error: any) {
                console.warn(`[AI API Route] ⚠ Model ${model} failed:`, error?.message || 'Unknown error');
                lastError = error;
                // Continue to next model
            }
        }

        // If we get here, all models failed
        console.error('[AI API Route] ❌ All models failed. Last error:', {
            message: lastError?.message,
            status: lastError?.status,
            code: lastError?.code,
            type: lastError?.constructor?.name
        });

        // Enhanced error message with diagnostic info
        let errorMessage = lastError?.message || "AI_CORE_REACH_FAILURE";

        if (lastError?.status === 429 || lastError?.message?.includes('429')) {
            errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        } else if (lastError?.status === 401 || lastError?.message?.includes('unauthorized')) {
            errorMessage = "Invalid API key. Please check your GROQ_API_KEY configuration.";
        } else if (lastError?.message?.includes('fetch')) {
            errorMessage = "Network error: Unable to reach Groq API. Please check your internet connection.";
        }

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });

    } catch (error: any) {
        console.error('[AI API Route] ❌ Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
