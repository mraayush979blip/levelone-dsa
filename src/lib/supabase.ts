import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// If the user provided just the project ID (e.g. tclvquwsxbntvwvozeto), convert it to a full URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

// Strict check for valid URL format to prevent crashing the build
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

if (!isValidUrl) {
    if (process.env.NODE_ENV === 'production') {
        if (typeof window === 'undefined') {
            console.warn('⚠️ [Supabase] Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Using placeholder for build.');
        } else {
            console.error('❌ [Supabase] NEXT_PUBLIC_SUPABASE_URL is missing or invalid! Check your Vercel project settings.');
        }
    }
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        console.error('❌ [Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid! Check your Vercel project settings.');
    }
}

if (typeof window !== 'undefined') {
    const maskedUrl = supabaseUrl ? (supabaseUrl.length > 15 ? `${supabaseUrl.substring(0, 15)}...` : supabaseUrl) : 'MISSING';
    const maskedKey = supabaseAnonKey ? `${supabaseAnonKey.substring(0, 8)}...` : 'MISSING';
    console.log(`📡 [Supabase] Connecting to: ${maskedUrl}`);

    // ISP Block Diagnostic
    fetch(supabaseUrl + '/rest/v1/', { method: 'HEAD', mode: 'no-cors' }).catch(err => {
        console.warn('⚠️ [Supabase] Connectivity Warning: If you are in India, your ISP might be blocking Supabase. Try changing DNS to 1.1.1.1 or 8.8.8.8.');
    });
}


// Dynamic Proxy Logic: Auto-detect if we are running on EdgeOne (India Bypass)
let finalBaseUrl = isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co';

if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const isEdgeOne = currentOrigin.includes('edgeone.app');
    const manualProxy = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL?.trim();

    // If we are on EdgeOne, we can proxy through the current domain's API routes or worker
    if (isEdgeOne) {
        // This is the "Magic" part: Use the current Batch URL as the proxy automatically
        finalBaseUrl = currentOrigin;
        console.log('🚀 [Supabase] EdgeOne detected: Using dynamic landing proxy:', finalBaseUrl);
    } else if (manualProxy) {
        finalBaseUrl = manualProxy;
    }
}

export const supabase = createClient(
    finalBaseUrl as string,
    ((isValidUrl && supabaseAnonKey) ? supabaseAnonKey : 'placeholder-key') as string,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Optimization for Proxy: ensure flow is preserved
            flowType: 'pkce'
        },
        global: {
            headers: { 'x-client-info': 'phase-learning-portal-proxied' }
        },
        realtime: {
            timeout: 20000
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
