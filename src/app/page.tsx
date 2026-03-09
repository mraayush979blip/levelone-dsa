'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Code, Terminal, BookOpen } from 'lucide-react';
import AnimatedBackground from '@/components/ui/animated-background';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';
import GlassCard from '@/components/ui/glass-card';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Only redirect if logged in
    if (!loading) {
      if (user) {
        if (user.role === 'admin') router.push('/admin');
        else router.push('/student');
      } else {
        // Show landing page content if not logged in
        setShowContent(true);
      }
    }
  }, [user, loading, router]);

  if (loading && !showContent) {
    return <NeonLoader />;
  }

  // If user is null and not loading, we show the landing page
  if (!user && showContent) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-white selection:text-black">
        {/* Subtle radial gradient to prevent absolute pitch black solid color */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,30,35,0.8),transparent_80%)]"></div>

        <div className="container px-4 md:px-6 z-10 relative">
          <StaggerContainer className="flex flex-col items-center text-center space-y-8">
            <StaggerItem>
              <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs tracking-widest uppercase font-semibold text-zinc-300 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-white mr-3 animate-pulse"></span>
                Next-Gen Learning Platform
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-sm font-sans leading-tight">
                Master Data Structures <br className="hidden md:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-zinc-300 to-zinc-600">& Algorithms</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-[700px] text-zinc-400 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed tracking-wide">
                Experience a gamified, phase-based learning environment tailored to help you conquer DSA and competitive programming.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-5 w-full justify-center pt-6">
                <Link href="/login" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-white px-10 font-bold text-black transition-all duration-300 hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <span className="mr-2">Get Started</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/team" className="group inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-transparent px-10 font-bold text-zinc-300 backdrop-blur transition-all hover:border-white hover:text-white hover:bg-zinc-900/50">
                  Our Team
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20" staggerDelay={0.2}>
            <StaggerItem>
              <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-xl transition duration-500 hover:bg-zinc-900/80 hover:border-zinc-700">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-inner">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Real-World Problem Solving</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Verify your logic directly on LeetCode with our automated assignment tracking.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-xl transition duration-500 hover:bg-zinc-900/80 hover:border-zinc-700">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-inner">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Gamified Progress</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Earn XP, badges, and level up as you complete challenges.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-xl transition duration-500 hover:bg-zinc-900/80 hover:border-zinc-700">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-inner">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">DSA Roadmaps</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Phase-by-phase learning pathways driving deep algorithmic intuition.</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    );
  }

  return null;
}
