import { createClient } from '@supabase/supabase-js';

// Get base URL from env
let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'tclvquwsxbntvwvozeto.supabase.co').trim();
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
}
if (!supabaseUrl.includes('.supabase.co')) {
    supabaseUrl += '.supabase.co';
}

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Determine the "Final" URL for the client.
let finalBaseUrl = supabaseUrl;
const projectHost = new URL(supabaseUrl).hostname;

// DYNAMIC PROBE: Check if we can reach Supabase directly
if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const isEdgeOne = origin.includes('edgeone.app') || origin.includes('vercel.app');
    const isDev = origin.includes('localhost') || origin.includes('127.0.0.1');

    // ONLY attempt tunnel if we're in production on EdgeOne/Vercel
    if (isEdgeOne && !isDev) {
        // DEFAULT: Use Proxy for reliability on first load
        // EXCEPTION: Use Direct only if the previous probe proved it's reachable.
        const cachedPath = localStorage.getItem('supabase_proxy_active');

        if (cachedPath === 'false') {
            finalBaseUrl = supabaseUrl; // ACCELERATED PATH
            console.log('⚡ [Supabase] Using Proven Direct Path (Fast)');
        } else {
            finalBaseUrl = origin; // SECURE TUNNEL
            console.log('🛡️ [Supabase] Using Reliable Proxy Path (Tunneling)');
        }

        // Background probe to update path for next session
        fetch(`https://${projectHost}/rest/v1/`, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
                localStorage.setItem('supabase_proxy_active', 'false');
                console.log('📡 [Probe] Direct path reachable. Speed will be boosted on next load.');
            })
            .catch(() => {
                localStorage.setItem('supabase_proxy_active', 'true');
                console.warn('📡 [Probe] Direct path blocked. Staying on reliable proxy.');
            });
    }
}

export const supabase = createClient(
    finalBaseUrl,
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            headers: {
                'x-client-info': 'levelone-bypass-v2.1'
            }
        }
    }
);

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
