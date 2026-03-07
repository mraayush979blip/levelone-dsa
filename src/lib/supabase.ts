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

if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const isEdgeOne = origin.includes('edgeone.app') || origin.includes('vercel.app');
    const isDev = origin.includes('localhost') || origin.includes('127.0.0.1');

    // In Production (EdgeOne), we MUST use the current origin as the proxy to bypass India ISP blocks
    if (isEdgeOne && !isDev) {
        finalBaseUrl = origin;
        console.log('🚀 [Supabase] India Bypass Active: Tunneling via', origin);
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
            headers: { 'x-client-info': 'levelone-bypass-v4' }
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
