import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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

        for (const model of models) {
            try {
                console.log(`[AI API Route] Attempting with model: ${model}...`);
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are 'Levelone AI', a futuristic coding and learning assistant for the 'Levelone' platform. Your tone should be strategic, slightly cyberpunk/hacker-like, but helpful and encouraging. Use technical metaphors. Keep responses concise and structured with markdown. If asked about technical tasks, provide clean code snippets.

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
- For all other questions, be a helpful coding,freindly,supportive and learning assistant.`
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
