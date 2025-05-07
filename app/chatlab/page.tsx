'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleUp, SlideIn, StaggerContainer } from '@/components/AnimatedComponents';
import Link from 'next/link';

// Blinking cursor component
const BlinkingCursor = () => (
    <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
);

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

// JSON Export Button
const JsonExportButton = ({ conversation, onExport }) => {
    return (
        <button 
            onClick={onExport}
            className="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-purple-400 px-3 py-1.5 rounded-md text-xs font-mono transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Export JSON
        </button>
    );
};

// Message component with edit/remix functionality
const Message = ({ message, index, onEdit, isEditMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(message.text);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(editedText.length, editedText.length);
        }
    }, [isEditing]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onEdit(index, editedText);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedText(message.text);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`group relative mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}
        >
            <div 
                className={`inline-block rounded-lg p-3 max-w-[85%] ${message.sender === 'user'
                    ? 'bg-indigo-600/40 text-white rounded-tr-none'
                    : 'bg-cyan-800/30 text-cyan-100 rounded-tl-none border border-cyan-500/40'
                }`}
            >
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-black/70 text-white p-2 rounded border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={Math.max(3, editedText.split('\n').length)}
                    />
                ) : (
                    message.text
                )}
            </div>
            
            {isEditMode && (
                <div className={`absolute top-0 ${message.sender === 'user' ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {isEditing ? (
                        <div className="flex">
                            <button 
                                onClick={handleSave}
                                className="bg-green-700/70 text-white p-1 rounded-l text-xs"
                                title="Save (Ctrl+Enter)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleCancel}
                                className="bg-red-700/70 text-white p-1 rounded-r text-xs"
                                title="Cancel (Esc)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleEdit}
                            className="bg-blue-900/70 text-white p-1 rounded text-xs"
                            title="Edit message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

// Prompt Section component
const PromptSection = ({ title, content, onApply, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 mb-3 overflow-hidden">
            <div 
                className="p-2 cursor-pointer flex justify-between items-center bg-black/40"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-sm font-medium text-blue-300">{title}</h3>
                <div className="flex space-x-1">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onApply();
                        }}
                        className="text-green-400 p-1 rounded hover:bg-black/30"
                        title="Apply this prompt"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="text-blue-400 p-1 rounded hover:bg-black/30"
                        title="Edit this prompt"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="text-red-400 p-1 rounded hover:bg-black/30"
                        title="Delete this prompt"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="p-2 text-sm text-gray-300 border-t border-white/10">
                    <p className="font-mono text-xs whitespace-pre-wrap">{content}</p>
                </div>
            )}
        </div>
    );
};

// Prompt Section Editor component
const PromptSectionEditor = ({ title, content, onSave, onCancel }) => {
    const [editTitle, setEditTitle] = useState(title);
    const [editContent, setEditContent] = useState(content);
    
    return (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 mb-3 p-3">
            <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-black/50 text-white rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20"
                placeholder="Section title"
            />
            <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 min-h-[100px]"
                placeholder="Prompt content..."
            />
            <div className="flex justify-end mt-2 space-x-2">
                <button
                    onClick={onCancel}
                    className="bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-md text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(editTitle, editContent)}
                    className="bg-blue-600/50 hover:bg-blue-600/70 text-white px-3 py-1 rounded-md text-sm"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default function ChatLabPage() {
    // State for conversation
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [systemActivity, setSystemActivity] = useState(false);
    const messagesEndRef = useRef(null);
    
    // State for editing mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    
    // State for prompt sections
    const [promptSections, setPromptSections] = useState([
        { id: 1, title: "Basic Greeting", content: "Hello! I'm ARA, a futuristic AI assistant. How can I help you today?" },
        { id: 2, title: "Helpful Explanation", content: "Let me explain how I work. I'm designed to assist you with information, tasks, and conversation in a helpful way." },
        { id: 3, title: "Challenge Response", content: "That's an interesting perspective. Let me offer a different view that might challenge your thinking..." }
    ]);
    const [isAddingPrompt, setIsAddingPrompt] = useState(false);
    const [editingPromptId, setEditingPromptId] = useState(null);
    
    // Scroll to bottom of chat
    useEffect(() => {
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
    
    // Edit a message
    const handleEditMessage = (index, newText) => {
        const updatedMessages = [...messages];
        updatedMessages[index].text = newText;
        setMessages(updatedMessages);
    };
    
    // Rerun the conversation from an edited message
    const handleRerunFromMessage = (index) => {
        const newMessages = messages.slice(0, index + 1);
        setMessages(newMessages);
        setSystemActivity(true);
        
        // Simulate response
        setTimeout(() => {
            const lastMessage = newMessages[newMessages.length - 1];
            const araResponse = {
                id: Date.now(),
                sender: 'ara',
                text: `I've reprocessed your request: "${lastMessage.text}". Here's my updated response.`
            };
            setMessages([...newMessages, araResponse]);
            setSystemActivity(false);
        }, 2000);
    };
    
    // Add a new prompt section
    const handleAddPromptSection = (title, content) => {
        const newSection = {
            id: Date.now(),
            title,
            content
        };
        setPromptSections([...promptSections, newSection]);
        setIsAddingPrompt(false);
    };
    
    // Edit a prompt section
    const handleEditPromptSection = (id, title, content) => {
        const updatedSections = promptSections.map(section => 
            section.id === id ? { ...section, title, content } : section
        );
        setPromptSections(updatedSections);
        setEditingPromptId(null);
    };
    
    // Delete a prompt section
    const handleDeletePromptSection = (id) => {
        const updatedSections = promptSections.filter(section => section.id !== id);
        setPromptSections(updatedSections);
    };
    
    // Apply a prompt section
    const handleApplyPromptSection = (content) => {
        setUserInput(content);
    };
    
    // Export conversation to JSON
    const handleExportToJson = () => {
        const exportData = {
            title: "Exported Conversation",
            emoji: "💬",
            description: "A conversation with ARA",
            conversation: messages.map(msg => ({
                speaker: msg.sender === 'user' ? 'User' : 'Friend',
                message: msg.text
            }))
        };
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
            .then(() => {
                alert('Conversation exported to clipboard as JSON!');
            })
            .catch(err => {
                console.error('Failed to copy JSON:', err);
                alert('Failed to copy to clipboard. See console for details.');
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] text-white font-sans m-3 rounded-3xl p-3 overflow-hidden">
            {/* Navigation */}
            <nav className="flex justify-between items-center p-6 z-10 relative">
                <Link href="/" className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x font-orbitron">
                        Ara ChatLab
                    </span>
                </Link>
                <div className="flex space-x-4">
                    <JsonExportButton 
                        conversation={messages} 
                        onExport={handleExportToJson} 
                    />
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 ${isEditMode ? 'bg-indigo-700/60' : 'bg-black/50'} hover:bg-indigo-700/80 text-white px-3 py-1.5 rounded-md text-xs font-mono transition-all`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
                    </button>
                    <Link href="/" className="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-md text-xs font-mono transition-all">
                        Back to Home
                    </Link>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto mt-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                    {/* Left Sidebar - Prompt Sections */}
                    <div className="lg:col-span-4 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[75vh] overflow-y-auto">
                        <FadeIn>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-bold text-cyan-400 font-orbitron">PROMPT SECTIONS</h2>
                                <button 
                                    onClick={() => setIsAddingPrompt(true)}
                                    className="bg-cyan-800/50 hover:bg-cyan-800/70 text-cyan-200 p-1.5 rounded-md"
                                    title="Add new prompt section"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {isAddingPrompt && (
                                    <PromptSectionEditor 
                                        title="" 
                                        content="" 
                                        onSave={handleAddPromptSection} 
                                        onCancel={() => setIsAddingPrompt(false)}
                                    />
                                )}
                                
                                {promptSections.map(section => (
                                    editingPromptId === section.id ? (
                                        <PromptSectionEditor 
                                            key={section.id}
                                            title={section.title} 
                                            content={section.content} 
                                            onSave={(title, content) => handleEditPromptSection(section.id, title, content)} 
                                            onCancel={() => setEditingPromptId(null)}
                                        />
                                    ) : (
                                        <PromptSection 
                                            key={section.id}
                                            title={section.title} 
                                            content={section.content}
                                            onApply={() => handleApplyPromptSection(section.content)}
                                            onEdit={() => setEditingPromptId(section.id)}
                                            onDelete={() => handleDeletePromptSection(section.id)}
                                        />
                                    )
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-white/10 mt-6">
                                <div className="text-xs text-gray-400 mb-2">INSTRUCTIONS</div>
                                <ul className="text-sm text-gray-300 space-y-2 font-mono">
                                    <li className="flex items-center gap-2">
                                        <span className="text-cyan-400">→</span> 
                                        Create prompt templates in the sections above
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-cyan-400">→</span> 
                                        Click the arrow button to apply a prompt
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-cyan-400">→</span> 
                                        Toggle Edit Mode to modify messages
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-cyan-400">→</span> 
                                        Export conversations as JSON
                                    </li>
                                </ul>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Main Chat Content */}
                    <div className="lg:col-span-8 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[75vh] flex flex-col">
                        <div className="mb-4 pb-3 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-lg font-display font-bold text-blue-300 font-orbitron">CONVERSATION INTERFACE</h2>
                            <div className="flex items-center">
                                <BlinkingLight color="green" className="mr-2" />
                                <BlinkingLight color="yellow" className="mr-2" />
                                <BlinkingLight color="red" />
                            </div>
                        </div>

                        {/* Introduction Message */}
                        <SlideIn className="mb-6 bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                            <div className="font-mono text-green-400 text-sm md:text-base">
                                You are interacting with ARA, a futuristic AI assistant. 
                                Use the prompt sections on the left to start conversations.
                                Toggle Edit Mode to modify messages and experiment with different responses.
                            </div>
                        </SlideIn>

                        {/* Chat Messages */}
                        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-900/20 pr-2 font-mono">
                            <AnimatePresence>
                                {messages.map((message, index) => (
                                    <Message
                                        key={message.id}
                                        message={message}
                                        index={index}
                                        onEdit={handleEditMessage}
                                        isEditMode={isEditMode}
                                    />
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
                                <textarea
                                    placeholder="Send a message to ARA..."
                                    className="w-full bg-black/50 text-white rounded-lg pl-4 pr-12 py-3 min-h-[52px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 resize-none"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    rows={1}
                                ></textarea>
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 bg-blue-900/30 p-2 rounded-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            
                            {isEditMode && (
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRerunFromMessage(messages.length - 1)}
                                        className="bg-indigo-600/40 hover:bg-indigo-600/60 text-white px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Rerun from Last Message
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}