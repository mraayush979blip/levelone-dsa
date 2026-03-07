import { createClient } from '@supabase/supabase-js';

// Get base URL from env
let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// 1. If project ID was provided instead of full URL, expand it.
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

// 2. Determine the "Final" URL for the client.
// If we are in the browser, and on EdgeOne, we proxy through the current domain.
let finalBaseUrl = supabaseUrl || 'https://placeholder.supabase.co';

if (typeof window !== 'undefined') {
    const isEdgeOne = window.location.origin.includes('edgeone.app');
    const isDev = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');

    // Skip proxy on Localhost to use direct connection (faster if DNS is set)
    // Use proxy on EdgeOne to bypass regional blocks (India ISP issue)
    if (isEdgeOne && !isDev) {
        finalBaseUrl = window.location.origin;
        console.log('🚀 [Supabase] India Bypass Active: Proxying via current origin');
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
            // Identifier for logs
            headers: { 'x-client-info': 'levelone-bypass-v2' }
        }
    }
);

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

// Helper function to sign in
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

// Helper function to sign out
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
