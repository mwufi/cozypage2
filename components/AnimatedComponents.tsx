'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Fade in animation
export const FadeIn = ({ children, delay = 0, className = '', duration = 0.8 }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Scale up animation
export const ScaleUp = ({ children, delay = 0, className = '', duration = 0.8 }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Slide in animation
export const SlideIn = ({ children, delay = 0, className = '', duration = 0.8, direction = 'left' }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const directionValue = {
        left: -100,
        right: 100,
        top: -100,
        bottom: 100,
    };

    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const initialValue = directionValue[direction];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, [axis]: initialValue }}
            animate={inView ? { opacity: 1, [axis]: 0 } : { opacity: 0, [axis]: initialValue }}
            transition={{ duration, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Staggered children animation
export const StaggerContainer = ({ children, staggerChildren = 0.1, delay = 0, className = '' }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren,
                delayChildren: delay,
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            variants={container}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({ children, className = '' }) => {
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
    };

    return (
        <motion.div variants={item} className={className}>
            {children}
        </motion.div>
    );
}; 