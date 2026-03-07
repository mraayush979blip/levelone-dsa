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
              // AUTO-SYNC VERSION: 2.1.0 (Critical Cache Purge)
              (function() {
                const CURRENT_DEPLOY = "2.1.0-final";
                const lastSync = localStorage.getItem("levelone_last_sync_v2");
                
                if (lastSync !== CURRENT_DEPLOY) {
                  console.log("🚀 [Sync] Critical update detected, purging legacy caches...");
                  
                  // 1. Force unregister all service workers (legacy cleanup)
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                      for(let reg of regs) {
                        reg.unregister();
                        console.log("🧹 [Sync] Unregistered stale worker:", reg.scope);
                      }
                    }).catch(() => {});
                  }
                  
                  // 2. Clear known stale storage keys
                  localStorage.removeItem("supabase.auth.token"); // Force session refresh if stuck
                  localStorage.setItem("levelone_last_sync_v2", CURRENT_DEPLOY);
                  
                  // 3. One-time hard reload with cache bypass
                  console.warn("🔄 [Sync] System restart in 1s...");
                  setTimeout(() => window.location.reload(), 1000);
                }
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
