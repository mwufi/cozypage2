'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// Animation for floating elements
export const FloatingElements = () => {
    const elementsRef = useRef([]);

    useEffect(() => {
        const elements = document.querySelectorAll('.floating-element');
        elementsRef.current = Array.from(elements);

        if (elementsRef.current.length === 0) return;

        elementsRef.current.forEach((element, index) => {
            gsap.to(element, {
                y: `${Math.sin(index) * 30}px`,
                duration: 3 + index * 0.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });

        return () => {
            elementsRef.current.forEach((element) => {
                gsap.killTweensOf(element);
            });
        };
    }, []);

    return null;
};

// Animation for background gradient
export const AnimatedGradient = () => {
    const gradientRef = useRef(null);

    useEffect(() => {
        const element = document.querySelector('.gradient-bg');
        if (!element) return;

        gradientRef.current = element;

        gsap.to(gradientRef.current, {
            backgroundPosition: '400% 0%',
            duration: 20,
            ease: 'none',
            repeat: -1,
        });

        return () => {
            gsap.killTweensOf(gradientRef.current);
        };
    }, []);

    return null;
};

// Animation for parallax scrolling
export const ParallaxScrolling = () => {
    useEffect(() => {
        const parallaxElements = document.querySelectorAll('.parallax');

        if (parallaxElements.length === 0) return;

        parallaxElements.forEach((element) => {
            const depth = element.getAttribute('data-depth') || 0.2;

            gsap.to(element, {
                y: `${window.innerHeight * depth * -1}px`,
                ease: 'none',
                scrollTrigger: {
                    trigger: element.parentElement,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        });
    }, []);

    return null;
};

// Animation for sections reveal
export const SectionsReveal = () => {
    useEffect(() => {
        const sections = document.querySelectorAll('.gsap-reveal');

        if (sections.length === 0) return;

        sections.forEach((section) => {
            gsap.fromTo(
                section,
                {
                    y: 100,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                    },
                }
            );
        });
    }, []);

    return null;
}; 