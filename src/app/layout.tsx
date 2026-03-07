import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'sonner';
import VersionCheck from "@/components/VersionCheck";
import NotificationListener from "@/components/NotificationListener";
import QueryProvider from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Levelone",
  description: "Phase-Based Learning Management System - sab ka sath sab vikas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // AUTO-SYNC VERSION: 2.4.0 (PWA-aware)
              (function() {
                const CURRENT_DEPLOY = "2.4.0-pwa";
                const lastSync = localStorage.getItem("levelone_last_sync_v4");
                
                function registerSW() {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(reg) { console.log('✅ [SW] Registered:', reg.scope); })
                      .catch(function(err) { console.warn('⚠️ [SW] Registration failed:', err); });
                  }
                }
                
                if (lastSync !== CURRENT_DEPLOY) {
                  console.log("🚀 [Sync] Update detected, refreshing caches...");
                  
                  // 1. Unregister old service workers
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                      for(let reg of regs) reg.unregister();
                    }).catch(() => {});
                  }
                  
                  // 2. Purge old caches
                  if ('caches' in window) {
                    caches.keys().then(keys => {
                      for(let key of keys) caches.delete(key);
                    }).catch(() => {});
                  }
                  
                  // 3. Set marker (don't clear all localStorage anymore — preserves user prefs)
                  localStorage.setItem("levelone_last_sync_v4", CURRENT_DEPLOY);
                  
                  // 4. Re-register fresh SW after cleanup
                  setTimeout(registerSW, 2000);
                } else {
                  // Normal load — ensure SW is registered
                  registerSW();
                }
              })();
            `
          }}
        />
        {/* ChunkLoadError Recovery — auto-recovers from stale chunk failures after deploys */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function handleChunkError(e) {
                  var msg = (e.message || e.reason && e.reason.message || '').toLowerCase();
                  if (
                    msg.includes('chunkloaderror') ||
                    msg.includes('loading chunk') ||
                    msg.includes('failed to fetch dynamically imported module') ||
                    msg.includes('importing a module script failed')
                  ) {
                    var key = 'levelone_chunk_reload';
                    var last = localStorage.getItem(key);
                    var now = Date.now();
                    
                    if (last && (now - parseInt(last, 10)) < 10000) {
                      // Persistent failure — nuclear cleanup
                      console.error('[Levelone] Persistent chunk error. Clearing all caches...');
                      sessionStorage.clear();
                      localStorage.removeItem(key);
                      if ('caches' in window) {
                        caches.keys().then(function(keys) {
                          keys.forEach(function(k) { caches.delete(k); });
                        });
                      }
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function(regs) {
                          regs.forEach(function(r) { r.unregister(); });
                        });
                      }
                    } else {
                      // First failure — quick reload
                      console.warn('[Levelone] Chunk load error detected. Reloading...');
                      localStorage.setItem(key, now.toString());
                      window.location.reload();
                    }
                  }
                }
                window.addEventListener('error', handleChunkError);
                window.addEventListener('unhandledrejection', function(e) {
                  handleChunkError({ message: (e.reason && e.reason.message) || '' });
                });
              })();
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <VersionCheck />
            <NotificationListener />
            {children}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
