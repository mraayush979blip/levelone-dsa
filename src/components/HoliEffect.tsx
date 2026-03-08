'use client';

import { useEffect, useRef, useCallback } from 'react';

const HOLI_COLORS = [
    '#FF1744', // gulaal red
    '#FF9100', // mango orange
    '#FFEA00', // turmeric yellow
    '#00E676', // parrot green
    '#00B0FF', // sky blue
    '#D500F9', // magenta
    '#F50057', // rose pink
    '#76FF03', // lime green
    '#FF6D00', // deep orange
    '#651FFF', // electric indigo
];

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    alpha: number;
    decay: number;
    life: number;
}

interface Splash {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    alpha: number;
    life: number;
    decay: number;
    splats: { angle: number; dist: number; size: number }[];
}

export default function HoliEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const splashesRef = useRef<Splash[]>([]);
    const animFrameRef = useRef<number>(0);
    const lastSpawnRef = useRef(0);
    const lastSplashRef = useRef(0);

    const createParticle = useCallback((canvasWidth: number, canvasHeight: number): Particle => {
        const edge = Math.random();
        let x: number, y: number;

        if (edge < 0.3) {
            x = Math.random() * canvasWidth;
            y = -10;
        } else if (edge < 0.5) {
            x = -10;
            y = Math.random() * canvasHeight * 0.6;
        } else if (edge < 0.7) {
            x = canvasWidth + 10;
            y = Math.random() * canvasHeight * 0.6;
        } else {
            x = Math.random() * canvasWidth;
            y = Math.random() * canvasHeight;
        }

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 0.8 + 0.2,
            radius: Math.random() * 4 + 1.5,
            color: HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)],
            alpha: Math.random() * 0.5 + 0.15,
            decay: Math.random() * 0.002 + 0.001,
            life: 1,
        };
    }, []);

    const createSplash = useCallback((canvasWidth: number, canvasHeight: number): Splash => {
        const margin = 80;
        const splats = [];
        const splatCount = Math.floor(Math.random() * 6) + 4;

        for (let i = 0; i < splatCount; i++) {
            splats.push({
                angle: (Math.PI * 2 * i) / splatCount + (Math.random() - 0.5) * 0.6,
                dist: Math.random() * 40 + 20,
                size: Math.random() * 15 + 8,
            });
        }

        return {
            x: margin + Math.random() * (canvasWidth - margin * 2),
            y: margin + Math.random() * (canvasHeight - margin * 2),
            radius: 0,
            maxRadius: Math.random() * 60 + 40,
            color: HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)],
            alpha: 0.35,
            life: 1,
            decay: 0.006 + Math.random() * 0.004,
            splats,
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Seed initial particles
        for (let i = 0; i < 40; i++) {
            particlesRef.current.push(createParticle(canvas.width, canvas.height));
        }

        const animate = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Spawn particles
            if (time - lastSpawnRef.current > 120) {
                if (particlesRef.current.length < 80) {
                    particlesRef.current.push(createParticle(canvas.width, canvas.height));
                }
                lastSpawnRef.current = time;
            }

            // Spawn random color splashes every 2-5 seconds
            if (time - lastSplashRef.current > 2000 + Math.random() * 3000) {
                if (splashesRef.current.length < 4) {
                    splashesRef.current.push(createSplash(canvas.width, canvas.height));
                }
                lastSplashRef.current = time;
            }

            // Draw splashes (behind particles)
            splashesRef.current = splashesRef.current.filter((s) => {
                s.life -= s.decay;
                if (s.radius < s.maxRadius) {
                    s.radius += (s.maxRadius - s.radius) * 0.08;
                }

                if (s.life <= 0) return false;

                const currentAlpha = s.alpha * s.life;

                // Main splash blob
                const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
                grad.addColorStop(0, s.color + Math.round(currentAlpha * 200).toString(16).padStart(2, '0'));
                grad.addColorStop(0.5, s.color + Math.round(currentAlpha * 100).toString(16).padStart(2, '0'));
                grad.addColorStop(1, s.color + '00');

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Irregular splat blobs around the center
                for (const splat of s.splats) {
                    const sx = s.x + Math.cos(splat.angle) * splat.dist * (s.radius / s.maxRadius);
                    const sy = s.y + Math.sin(splat.angle) * splat.dist * (s.radius / s.maxRadius);
                    const splatAlpha = currentAlpha * 0.7;

                    const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, splat.size);
                    sGrad.addColorStop(0, s.color + Math.round(splatAlpha * 200).toString(16).padStart(2, '0'));
                    sGrad.addColorStop(1, s.color + '00');

                    ctx.beginPath();
                    ctx.arc(sx, sy, splat.size * (s.radius / s.maxRadius), 0, Math.PI * 2);
                    ctx.fillStyle = sGrad;
                    ctx.fill();
                }

                return true;
            });

            // Draw particles
            particlesRef.current = particlesRef.current.filter((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx += (Math.random() - 0.5) * 0.05;
                p.life -= p.decay;

                if (p.life <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
                    return false;
                }

                const currentAlpha = p.alpha * p.life;

                // Soft glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                gradient.addColorStop(0, p.color + Math.round(currentAlpha * 255).toString(16).padStart(2, '0'));
                gradient.addColorStop(0.4, p.color + Math.round(currentAlpha * 128).toString(16).padStart(2, '0'));
                gradient.addColorStop(1, p.color + '00');

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Core particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.round(currentAlpha * 255).toString(16).padStart(2, '0');
                ctx.fill();

                return true;
            });

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animFrameRef.current);
            particlesRef.current = [];
            splashesRef.current = [];
        };
    }, [createParticle, createSplash]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[1] pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
        />
    );
}
