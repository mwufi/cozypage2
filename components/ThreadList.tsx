'use client';

import React from 'react'; // Removed useState, useEffect as they are no longer needed
import { Loader2 } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns'; // For date formatting

// Interface matching backend's EnrichedThread
interface GmailThread {
    id: string;
    snippet: string;
    historyId: string;
    latest_message_subject?: string;
    latest_message_from?: string;
    latest_message_date?: string; // Keep as string, parse for display
}

// Props for the ThreadList component
interface ThreadListProps {
    threads: GmailThread[];
    isLoading: boolean;
    error: string | null;
    onSelectThread: (threadId: string) => void;
    selectedLabelId: string | null;
}

// Helper to parse Gmail's From header (handles "Name <email>" format)
const parseSender = (fromHeader: string | undefined): string => {
    if (!fromHeader) return 'Unknown Sender';
    // Remove email address part if present
    const namePart = fromHeader.replace(/<.*?>/g, '').trim();
    // Remove quotes if present
    const cleanedName = namePart.replace(/^"|"$/g, '').trim();
    return cleanedName || 'Unknown Sender'; // Return cleaned name or fallback
};

// Helper to format date string (can be complex due to various Gmail date formats)
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
        // Gmail internalDate is ms timestamp
        if (/^\d+$/.test(dateString)) {
            const date = new Date(parseInt(dateString));
            if (!isValid(date)) return "";
            // Format based on how old the date is (e.g., time if today, date otherwise)
            const now = new Date();
            if (format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
                return format(date, 'p'); // e.g., 5:05 PM
            }
            return format(date, 'MMM d'); // e.g., May 6
        }

        // Attempt to parse standard date headers (RFC 2822 style)
        // date-fns parseISO doesn't handle RFC 2822 directly well, Date constructor is better here
        const date = new Date(dateString);
        if (!isValid(date)) return ""; // Return empty if invalid

        const now = new Date();
        if (format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
            return format(date, 'p'); // e.g., 5:05 PM
        }
        return format(date, 'MMM d'); // e.g., May 6

    } catch (e) {
        console.warn("Error formatting date:", dateString, e);
        return ""; // Fallback to empty string
    }
};

// --- Component Renamed: ThreadList ---
const ThreadList: React.FC<ThreadListProps> = ({
    threads,
    isLoading,
    error,
    onSelectThread,
    selectedLabelId
}) => {

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
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <table className="w-full text-sm table-fixed">
                    <tbody>
                        {threads.map((thread) => {
                            const senderName = parseSender(thread.latest_message_from);
                            const displaySubject = thread.latest_message_subject || '(no subject)';
                            const displaySnippet = thread.snippet || '';
                            const displayDate = formatDate(thread.latest_message_date);
                            // TODO: Add indicators for unread, draft status, labels

                            return (
                                <tr
                                    key={thread.id}
                                    className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer group"
                                    onClick={() => onSelectThread(thread.id)}
                                >
                                    {/* Checkbox + Star (placeholder) */}
                                    <td className="px-2 py-2.5 w-16 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-0 focus:ring-offset-0" />
                                            {/* Star icon placeholder */}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.098c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                        </div>
                                    </td>
                                    {/* Sender */}
                                    <td className="px-2 py-2.5 w-48 font-medium text-gray-200 truncate" title={senderName}>{senderName}</td>
                                    {/* Subject & Snippet */}
                                    <td className="px-2 py-2.5 text-gray-300 truncate">
                                        <span className="font-medium text-gray-200">{displaySubject}</span>
                                        <span className="text-gray-400 ml-1">- {displaySnippet}</span>
                                    </td>
                                    {/* Date */}
                                    <td className="px-3 py-2.5 w-24 text-right text-xs text-gray-400 font-semibold whitespace-nowrap">{displayDate}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ThreadList; 