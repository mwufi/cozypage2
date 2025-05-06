'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Floating particles effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configure canvas
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        // Particle settings
        const particleCount = 50;
        const particles: {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            opacity: number;
        }[] = [];

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `rgba(80, 100, 255, ${Math.random() * 0.5 + 0.2})`,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();

                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around canvas
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            });

            requestAnimationFrame(drawParticles);
        };

        drawParticles();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 z-0 pointer-events-none opacity-50"
            />

            {/* Animated gradient orbs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl -z-10 floating-element"
                    initial={{ opacity: 0.4 }}
                    animate={{
                        opacity: [0.4, 0.6, 0.4],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 70%, rgba(59,130,246,0) 100%)' }}
                />

                <motion.div
                    className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] rounded-full blur-3xl -z-10 floating-element"
                    initial={{ opacity: 0.4 }}
                    animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1.5
                    }}
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 70%, rgba(99,102,241,0) 100%)' }}
                />

                <motion.div
                    className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl -z-10 floating-element"
                    initial={{ opacity: 0.3 }}
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.08, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 3
                    }}
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 70%, rgba(139,92,246,0) 100%)' }}
                />
            </div>
        </>
    );
} 