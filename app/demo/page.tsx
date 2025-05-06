'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleUp, SlideIn } from '@/components/AnimatedComponents';
import Link from 'next/link';

// Blinking cursor component for terminal-like effect
const BlinkingCursor = () => (
    <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
);

// System message component with typewriter effect
const SystemMessage = ({ text, delay = 0, speed = 40 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeout;

        // Wait for the initial delay
        timeout = setTimeout(() => {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayedText(text.substring(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                    setIsComplete(true);
                }
            }, speed);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [text, delay, speed]);

    return (
        <div className="font-mono text-green-400 text-sm md:text-base font-space-mono">
            {displayedText}
            {!isComplete && <BlinkingCursor />}
        </div>
    );
};

// Blinking light component
const BlinkingLight = ({ color = 'blue', speed = 'normal', size = 'md', className = '' }) => {
    const speedMap = {
        slow: 'animate-pulse-slow',
        normal: 'animate-pulse',
        fast: 'animate-pulse-fast',
        rapid: 'animate-pulse-rapid'
    };

    const sizeMap = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    const colorMap = {
        blue: 'bg-blue-400',
        green: 'bg-green-400',
        red: 'bg-red-400',
        yellow: 'bg-yellow-400',
        purple: 'bg-purple-400',
        cyan: 'bg-cyan-400'
    };

    return (
        <div className={`rounded-full ${colorMap[color]} ${sizeMap[size]} ${speedMap[speed]} ${className}`}></div>
    );
};

// Status indicator component
const StatusIndicator = ({ label, status, className = '' }) => {
    const statusMap = {
        online: 'text-green-400',
        offline: 'text-red-400',
        idle: 'text-yellow-400',
        processing: 'text-blue-400'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <BlinkingLight color={status === 'online' ? 'green' : status === 'offline' ? 'red' : status === 'idle' ? 'yellow' : 'blue'} />
            <span className="text-xs text-gray-400">{label}:</span>
            <span className={`text-xs font-medium ${statusMap[status]}`}>{status.toUpperCase()}</span>
        </div>
    );
};

export default function DemoPage() {
    const [systemActivity, setSystemActivity] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [memoryItems, setMemoryItems] = useState([
        { id: 1, type: 'file', name: 'project_proposal.pdf', lastAccess: '2 days ago' },
        { id: 2, type: 'contact', name: 'Sarah Johnson', relation: 'colleague' },
        { id: 3, type: 'preference', name: 'Prefers dark mode UI', source: 'observation' }
    ]);
    const [recalledItems, setRecalledItems] = useState([]);
    const messagesEndRef = useRef(null);

    // Simulate typing the ARA introduction
    useEffect(() => {
        // Scroll to bottom whenever messages change
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle sending a message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        // Add user message
        const newUserMessage = { id: Date.now(), sender: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');

        // Simulate system activity
        setSystemActivity(true);

        // Simulate recalling items
        if (userInput.toLowerCase().includes('project') || userInput.toLowerCase().includes('proposal')) {
            setTimeout(() => {
                setRecalledItems([memoryItems[0]]);
            }, 1000);
        } else if (userInput.toLowerCase().includes('sarah') || userInput.toLowerCase().includes('johnson')) {
            setTimeout(() => {
                setRecalledItems([memoryItems[1]]);
            }, 1000);
        } else {
            setRecalledItems([]);
        }

        // Simulate ARA's response after delay
        setTimeout(() => {
            const araResponse = {
                id: Date.now() + 1,
                sender: 'ara',
                text: `I've processed your request: "${userInput}". How can I assist you further?`
            };
            setMessages(prev => [...prev, araResponse]);
            setSystemActivity(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] text-white font-sans m-3 rounded-3xl p-3 overflow-hidden">
            {/* Navigation */}
            <nav className="flex justify-between items-center p-6 z-10 relative">
                <Link href="/" className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x font-orbitron">
                        Ara Demo
                    </span>
                </Link>
                <Link href="/" className="text-white/60 hover:text-white transition-colors">
                    Back to Home
                </Link>
            </nav>

            <div className="max-w-7xl mx-auto mt-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[75vh] overflow-y-auto">
                        <FadeIn>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-bold text-cyan-400 font-orbitron">ARA SYSTEMS</h2>
                                <BlinkingLight color="cyan" />
                            </div>

                            <div className="space-y-4 font-space-mono">
                                <StatusIndicator label="Core Systems" status="online" />
                                <StatusIndicator label="Memory Matrix" status="online" />
                                <StatusIndicator label="Neural Net" status="online" />
                                <StatusIndicator label="User Profile" status="online" />

                                <div className="pt-4 border-t border-white/10">
                                    <div className="text-xs text-gray-400 mb-2">MEMORY LOGS</div>
                                    <SystemMessage
                                        text="Loading memory banks..."
                                        delay={1000}
                                    />
                                    <SystemMessage
                                        text="18 files indexed"
                                        delay={3000}
                                    />
                                    <SystemMessage
                                        text="3 preferences stored"
                                        delay={4000}
                                    />
                                    <SystemMessage
                                        text="7 relationships identified"
                                        delay={5000}
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="text-xs text-gray-400 mb-2">SYSTEM STATUS</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="flex flex-col items-center bg-black/30 p-2 rounded-lg">
                                                <BlinkingLight
                                                    color={i % 3 === 0 ? 'blue' : i % 3 === 1 ? 'green' : 'cyan'}
                                                    speed={i % 4 === 0 ? 'slow' : i % 4 === 1 ? 'normal' : i % 4 === 2 ? 'fast' : 'rapid'}
                                                />
                                                <span className="text-[10px] mt-1 text-gray-500">NODE-{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="text-xs text-gray-400 mb-2">USER PROFILE</div>
                                    <SystemMessage
                                        text="Relationship Status: New User"
                                        delay={6000}
                                    />
                                    <SystemMessage
                                        text="Preference Analysis: In Progress"
                                        delay={7000}
                                    />
                                    <SystemMessage
                                        text="Ready for interaction..."
                                        delay={8000}
                                    />
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Main Chat Content */}
                    <div className="lg:col-span-6 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[75vh] flex flex-col">
                        <div className="mb-4 pb-3 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-lg font-display font-bold text-blue-300 font-orbitron">ARA INTERFACE</h2>
                            <div className="flex items-center">
                                <BlinkingLight color="green" className="mr-2" />
                                <BlinkingLight color="yellow" className="mr-2" />
                                <BlinkingLight color="red" />
                            </div>
                        </div>

                        {/* Introduction Message */}
                        <SlideIn className="mb-6 bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                            <SystemMessage
                                text="You are ARA, a futuristic personal assistant designed to understand and adapt to your needs. I am here to assist with information retrieval, task management, and providing intelligent conversation."
                                delay={500}
                                speed={20}
                            />
                        </SlideIn>

                        {/* Chat Messages */}
                        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-900/20 pr-2 font-mono">
                            <AnimatePresence>
                                {messages.map(message => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}
                                    >
                                        <div className={`inline-block rounded-lg p-3 max-w-[85%] ${message.sender === 'user'
                                            ? 'bg-indigo-600/40 text-white rounded-tr-none'
                                            : 'bg-cyan-800/30 text-cyan-100 rounded-tl-none border border-cyan-500/40'
                                            }`}>
                                            {message.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* System Activity Indicator */}
                        {systemActivity && (
                            <div className="py-2 px-4 bg-blue-900/30 rounded-lg mb-4 flex items-center">
                                <div className="flex space-x-1 mr-3">
                                    <BlinkingLight color="blue" speed="rapid" />
                                    <BlinkingLight color="cyan" speed="rapid" />
                                    <BlinkingLight color="blue" speed="rapid" />
                                </div>
                                <span className="text-sm text-blue-300 font-mono">ARA is processing...</span>
                            </div>
                        )}

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="mt-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Send a message to ARA..."
                                    className="w-full bg-black/50 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 bg-blue-900/30 p-2 rounded-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Sidebar - Memory Items */}
                    <div className="lg:col-span-3 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[75vh] overflow-y-auto">
                        <FadeIn>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-bold text-purple-400 font-orbitron">MEMORY MATRIX</h2>
                                <BlinkingLight color="purple" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-gray-400 mb-2 font-mono">STORED ITEMS</div>
                                    <div className="space-y-2">
                                        {memoryItems.map(item => (
                                            <div key={item.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${item.type === 'file' ? 'bg-blue-400' :
                                                            item.type === 'contact' ? 'bg-green-400' : 'bg-yellow-400'
                                                            }`}></span>
                                                        <span className="text-sm font-medium">{item.name}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{item.type}</span>
                                                </div>
                                                {item.lastAccess && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Last access: {item.lastAccess}
                                                    </div>
                                                )}
                                                {item.relation && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Relation: {item.relation}
                                                    </div>
                                                )}
                                                {item.source && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Source: {item.source}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {recalledItems.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-2 font-mono">RECALLED ITEMS</div>
                                        <div className="space-y-2">
                                            {recalledItems.map(item => (
                                                <div key={item.id} className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/40 animate-pulse-once">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <span className={`w-2 h-2 rounded-full mr-2 ${item.type === 'file' ? 'bg-blue-400' :
                                                                item.type === 'contact' ? 'bg-green-400' : 'bg-yellow-400'
                                                                }`}></span>
                                                            <span className="text-sm font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="text-xs text-purple-300">Recalled</span>
                                                    </div>
                                                    {item.lastAccess && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Last access: {item.lastAccess}
                                                        </div>
                                                    )}
                                                    {item.relation && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Relation: {item.relation}
                                                        </div>
                                                    )}
                                                    {item.source && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Source: {item.source}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </div>
    );
} 