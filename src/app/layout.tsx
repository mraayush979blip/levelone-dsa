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
              // AUTO-SYNC VERSION: 2.3.0 (CORS Fix + Purge)
              (function() {
                const CURRENT_DEPLOY = "2.3.0-final";
                const lastSync = localStorage.getItem("levelone_last_sync_v4");
                
                if (lastSync !== CURRENT_DEPLOY) {
                  console.log("🚀 [Sync] Nuclear update detected, performing full system reset...");
                  
                  // 1. Unregister ALL service workers
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                      for(let reg of regs) reg.unregister();
                    }).catch(() => {});
                  }
                  
                  // 2. Purge all Browser Caches
                  if ('caches' in window) {
                    caches.keys().then(keys => {
                      for(let key of keys) caches.delete(key);
                    }).catch(() => {});
                  }
                  
                  // 3. Clear Storage & Set Marker
                  localStorage.clear();
                  sessionStorage.clear();
                  localStorage.setItem("levelone_last_sync_v3", CURRENT_DEPLOY);
                  
                  // 4. Force Hard Reload
                  console.warn("🔄 [Sync] Emergency system reset in progress... Cleaning stale workers.");
                  setTimeout(() => window.location.reload(true), 1500);
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
