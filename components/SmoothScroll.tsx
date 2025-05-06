'use client';

import { useEffect } from 'react';

export default function SmoothScroll() {
    useEffect(() => {
        // Add smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = anchor.getAttribute('href');
                if (!targetId || targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                window.scrollTo({
                    top: targetElement.getBoundingClientRect().top + window.scrollY,
                    behavior: 'smooth'
                });
            });
        });

        return () => {
            anchorLinks.forEach(anchor => {
                anchor.removeEventListener('click', () => { });
            });
        };
    }, []);

    return null;
} 