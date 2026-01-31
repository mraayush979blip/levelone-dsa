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
      <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <AnimatedBackground theme="theme-neon" />

        <div className="container px-4 md:px-6 z-10 relative">
          <StaggerContainer className="flex flex-col items-center text-center space-y-8">
            <StaggerItem>
              <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                Next-Gen Learning Platform
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-400 drop-shadow-sm">
                Master Web Development <br className="hidden md:inline" />
                <span className="text-blue-500">The Modern Way</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Experience a gamified, interactive learning environment designed to take you from zero to hero.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link href="/login" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 font-medium text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                  <span className="mr-2">Get Started</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/about" className="group inline-flex h-12 items-center justify-center rounded-full border border-gray-700 bg-gray-900/50 px-8 font-medium text-gray-300 backdrop-blur transition-all hover:bg-gray-800 hover:text-white">
                  Learn More
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20" staggerDelay={0.2}>
            <StaggerItem>
              <GlassCard className="h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Terminal className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Interactive Coding</h3>
                <p className="text-gray-400">Run code directly in your browser with our advanced playground.</p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard className="h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Gamified Progress</h3>
                <p className="text-gray-400">Earn XP, badges, and level up as you complete challenges.</p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard className="h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Curated Curriculum</h3>
                <p className="text-gray-400">Structured learning path from basics to advanced concepts.</p>
              </GlassCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    );
  }

  return null;
}
