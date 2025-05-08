'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";

// Interface for a single thread in the list
interface GmailThread {
    id: string;
    snippet: string;
    historyId: string;
    // Enriched data (optional)
    subject?: string;
    from?: string;
}

// Props for the ThreadList component
interface ThreadListProps {
    threads: GmailThread[];
    isLoading: boolean;
    error: string | null;
    onSelectThread: (threadId: string) => void;
    selectedLabelId: string | null; // Keep for context or header if needed
}

// Placeholder function to extract info from snippet (can be improved)
const parseSnippet = (snippet: string) => {
    // Very basic: assumes sender might be before a dash or colon if present early
    const separatorIndex = snippet.search(/ [-:] /);
    let from = 'Unknown Sender';
    let text = snippet;
    if (separatorIndex > 0 && separatorIndex < 30) { // Crude check
        from = snippet.substring(0, separatorIndex).trim();
        text = snippet.substring(separatorIndex + 3).trim();
    } else {
        // Maybe just take first few words as sender?
        const words = snippet.split(' ');
        if (words.length > 2) from = words.slice(0, 2).join(' ');
    }
    // Limit snippet length
    text = text.length > 100 ? text.substring(0, 97) + '...' : text;
    return { from, text };
}

// --- Component Renamed: ThreadList ---
const ThreadList: React.FC<ThreadListProps> = ({
    threads,
    isLoading,
    error,
    onSelectThread,
    selectedLabelId
}) => {

    // We are no longer fetching data inside this component.
    // Data (threads list) is passed down as props from DashboardPage.

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-400 py-8">Error: {error}</div>;
    }

    if (!threads || threads.length === 0) {
        return <p className="text-center text-gray-400 py-8">No conversations found.</p>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Optional Header */}
            {/* <div className="p-2 border-b border-gray-700 text-sm text-gray-400">
                 Label: {selectedLabelId || 'N/A'}
            </div> */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {threads.map((thread) => {
                    // Attempt to parse sender/subject from snippet (very basic)
                    const { from, text: snippetText } = parseSnippet(thread.snippet);
                    // Ideally, backend would provide subject/sender for threads.list

                    return (
                        <div
                            key={thread.id}
                            className="bg-gray-800 p-3 rounded-md shadow-sm hover:bg-gray-750 transition-colors duration-150 border border-gray-700 cursor-pointer"
                            onClick={() => onSelectThread(thread.id)}
                        >
                            {/* Enhance this display - maybe show participants? */}
                            <h3 className="text-sm font-semibold text-gray-200 truncate mb-1" title={from}>
                                {from}
                            </h3>
                            <p className="text-xs text-gray-400 line-clamp-2">
                                {thread.snippet}
                            </p>
                            {/* Add date of last message? Would require more data from backend */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ThreadList; // Export with new name 