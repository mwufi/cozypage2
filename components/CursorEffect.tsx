'use client';

import { useEffect, useState } from 'react';

export default function CursorEffect() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [cursorElements, setCursorElements] = useState<HTMLDivElement[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Create cursor trail elements
        const cursorCount = 15;
        const newCursorElements: HTMLDivElement[] = [];

        for (let i = 0; i < cursorCount; i++) {
            const cursorElement = document.createElement('div');
            cursorElement.className = 'cursor-trail';
            cursorElement.style.opacity = `${1 - i * 0.05}`;
            cursorElement.style.width = `${8 - i * 0.3}px`;
            cursorElement.style.height = `${8 - i * 0.3}px`;

            document.body.appendChild(cursorElement);
            newCursorElements.push(cursorElement);
        }

        setCursorElements(newCursorElements);

        // Track mouse movement
        const onMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        // Hide cursor trail when mouse leaves window
        const onMouseLeave = () => {
            setIsVisible(false);
        };

        // Show cursor trail when mouse enters window
        const onMouseEnter = () => {
            setIsVisible(true);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('mouseenter', onMouseEnter);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('mouseenter', onMouseEnter);

            // Clean up cursor elements
            newCursorElements.forEach(element => {
                document.body.removeChild(element);
            });
        };
    }, []);

    // Update cursor positions with delay effect
    useEffect(() => {
        if (!cursorElements.length) return;

        cursorElements.forEach((element, index) => {
            setTimeout(() => {
                if (isVisible) {
                    element.style.left = `${position.x}px`;
                    element.style.top = `${position.y}px`;
                    element.style.opacity = '1';
                } else {
                    element.style.opacity = '0';
                }
            }, index * 30); // Staggered delay for trail effect
        });
    }, [position, cursorElements, isVisible]);

    return null;
} 