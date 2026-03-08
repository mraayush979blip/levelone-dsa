'use client';

import { motion } from 'framer-motion';

function SplashBlob({ color, size, x, y, delay, blur, opacity = 0.85 }: {
    color: string; size: number; x: string; y: string; delay: number; blur: number; opacity?: number;
}) {
    const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
    const halfOpacity = Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0');

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1],
            }}
            transition={{
                duration: 1.5,
                delay,
                ease: 'easeOut',
            }}
            style={{
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                left: x,
                top: y,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}${hexOpacity}, ${color}${halfOpacity}, transparent)`,
                filter: `blur(${blur}px)`,
                pointerEvents: 'none',
            }}
        />
    );
}

function SplatDrip({ color, x, y, w, h, delay, rotate = 0 }: {
    color: string; x: string; y: string; w: number; h: number; delay: number; rotate?: number;
}) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 1], opacity: [0, 0.75, 0.65] }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                width: `${w}px`,
                height: `${h}px`,
                left: x,
                top: y,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${color}cc, ${color}88, transparent)`,
                filter: 'blur(3px)',
                transform: `rotate(${rotate}deg)`,
                pointerEvents: 'none',
            }}
        />
    );
}

function PowderDots({ color, count, areaX, areaY, areaW, areaH, delay }: {
    color: string; count: number; areaX: number; areaY: number; areaW: number; areaH: number; delay: number;
}) {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.8, 1], opacity: [0, 0.8, 0.6] }}
                    transition={{ duration: 0.8, delay: delay + i * 0.06, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        width: `${3 + Math.random() * 6}px`,
                        height: `${3 + Math.random() * 6}px`,
                        left: `${areaX + Math.random() * areaW}px`,
                        top: `${areaY + Math.random() * areaH}px`,
                        borderRadius: '50%',
                        background: color,
                        pointerEvents: 'none',
                    }}
                />
            ))}
        </>
    );
}

export function CornerSplashNav() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            {/* === LEFT CORNER — Big dark stains === */}
            <SplashBlob color="#FF1744" size={120} x="-30px" y="-30px" delay={0} blur={10} opacity={0.7} />
            <SplashBlob color="#E91E63" size={80} x="40px" y="-10px" delay={0.15} blur={8} opacity={0.6} />
            <SplashBlob color="#FF9100" size={70} x="10px" y="15px" delay={0.3} blur={6} opacity={0.55} />
            <SplashBlob color="#FFEA00" size={50} x="70px" y="25px" delay={0.4} blur={6} opacity={0.5} />
            <SplatDrip color="#FF1744" x="20px" y="40px" w={30} h={45} delay={0.5} rotate={15} />
            <SplatDrip color="#FF9100" x="55px" y="35px" w={20} h={35} delay={0.6} rotate={-10} />
            <PowderDots color="#FF1744" count={12} areaX={0} areaY={0} areaW={120} areaH={65} delay={0.2} />
            <PowderDots color="#FF9100" count={8} areaX={30} areaY={10} areaW={90} areaH={50} delay={0.4} />
            <PowderDots color="#FFEA00" count={6} areaX={60} areaY={5} areaW={60} areaH={40} delay={0.5} />

            {/* === RIGHT CORNER — Big dark stains === */}
            <SplashBlob color="#00B0FF" size={110} x="calc(100% - 70px)" y="-25px" delay={0.1} blur={10} opacity={0.7} />
            <SplashBlob color="#2979FF" size={75} x="calc(100% - 110px)" y="0px" delay={0.25} blur={8} opacity={0.6} />
            <SplashBlob color="#D500F9" size={65} x="calc(100% - 50px)" y="20px" delay={0.35} blur={6} opacity={0.55} />
            <SplashBlob color="#00E676" size={45} x="calc(100% - 130px)" y="15px" delay={0.45} blur={6} opacity={0.5} />
            <SplatDrip color="#00B0FF" x="calc(100% - 90px)" y="40px" w={25} h={40} delay={0.5} rotate={-15} />
            <SplatDrip color="#D500F9" x="calc(100% - 45px)" y="35px" w={22} h={38} delay={0.6} rotate={10} />
            <PowderDots color="#00B0FF" count={12} areaX={-120} areaY={0} areaW={120} areaH={65} delay={0.3} />
            <PowderDots color="#D500F9" count={8} areaX={-100} areaY={10} areaW={80} areaH={50} delay={0.5} />
            <PowderDots color="#00E676" count={5} areaX={-80} areaY={5} areaW={60} areaH={40} delay={0.6} />
        </div>
    );
}

export function CornerSplashFooter() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            {/* === LEFT CORNER — Big dark stains === */}
            <SplashBlob color="#00E676" size={110} x="-25px" y="calc(100% - 70px)" delay={0} blur={10} opacity={0.65} />
            <SplashBlob color="#76FF03" size={70} x="35px" y="calc(100% - 50px)" delay={0.2} blur={7} opacity={0.55} />
            <SplashBlob color="#FFEA00" size={55} x="5px" y="calc(100% - 100px)" delay={0.35} blur={6} opacity={0.5} />
            <SplashBlob color="#D500F9" size={45} x="70px" y="calc(100% - 85px)" delay={0.4} blur={5} opacity={0.45} />
            <SplatDrip color="#00E676" x="25px" y="calc(100% - 110px)" w={25} h={40} delay={0.5} rotate={-10} />
            <PowderDots color="#00E676" count={10} areaX={0} areaY={-80} areaW={110} areaH={80} delay={0.2} />
            <PowderDots color="#FFEA00" count={6} areaX={20} areaY={-60} areaW={70} areaH={60} delay={0.4} />

            {/* === RIGHT CORNER — Big dark stains === */}
            <SplashBlob color="#F50057" size={100} x="calc(100% - 60px)" y="calc(100% - 65px)" delay={0.1} blur={10} opacity={0.65} />
            <SplashBlob color="#FF9100" size={70} x="calc(100% - 100px)" y="calc(100% - 45px)" delay={0.25} blur={7} opacity={0.55} />
            <SplashBlob color="#651FFF" size={55} x="calc(100% - 45px)" y="calc(100% - 95px)" delay={0.35} blur={6} opacity={0.5} />
            <SplashBlob color="#00B0FF" size={40} x="calc(100% - 120px)" y="calc(100% - 80px)" delay={0.45} blur={5} opacity={0.45} />
            <SplatDrip color="#F50057" x="calc(100% - 80px)" y="calc(100% - 105px)" w={22} h={38} delay={0.5} rotate={12} />
            <PowderDots color="#F50057" count={10} areaX={-110} areaY={-80} areaW={110} areaH={80} delay={0.3} />
            <PowderDots color="#FF9100" count={6} areaX={-90} areaY={-60} areaW={70} areaH={60} delay={0.5} />
        </div>
    );
}
