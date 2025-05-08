'use client';

import React from 'react';

export interface MailItem {
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
}

interface MailListProps {
    mails: MailItem[];
}

// Helper to safely parse and format a date string
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) {
            return dateString; // Return original string if date is invalid
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        console.warn("Error formatting date:", dateString, e);
        return dateString; // Fallback to original string
    }
};

// Basic HTML unescaping (very simplified - consider a library for robust unescaping)
const unescapeHtml = (safeHtml: string) => {
    if (typeof document === 'undefined') return safeHtml; // Guard for SSR or non-browser env
    const Ktextarea = document.createElement("textarea");
    Ktextarea.innerHTML = safeHtml;
    return Ktextarea.value;
}

const MailList: React.FC<MailListProps> = ({ mails }) => {
    if (!mails || mails.length === 0) {
        return <p className="text-center text-gray-400 py-8">Your inbox is empty or no messages found.</p>;
    }

    return (
        <div className="space-y-4">
            {mails.map((mail) => (
                <div
                    key={mail.id}
                    className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-600"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <h3 className="text-lg md:text-xl font-semibold text-blue-300 mb-1 sm:mb-0 break-all">
                            {unescapeHtml(mail.subject)}
                        </h3>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(mail.date)}</p>
                    </div>
                    <div className="text-sm text-gray-300 mb-3 break-all">
                        <span className="font-medium text-gray-400">From:</span> {unescapeHtml(mail.from)}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                        {mail.snippet}
                    </p>
                    {/* Future: Link to view full email? */}
                </div>
            ))}
        </div>
    );
};

export default MailList; 