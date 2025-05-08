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
    onSelectMail: (mailId: string) => void;
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

const MailList: React.FC<MailListProps> = ({ mails, onSelectMail }) => {
    if (!mails || mails.length === 0) {
        return <p className="text-center text-gray-400 py-8">No messages found.</p>;
    }

    return (
        <div className="space-y-2">
            {mails.map((mail) => (
                <div
                    key={mail.id}
                    className="bg-gray-800 p-3 rounded-md shadow-md hover:bg-gray-750 transition-colors duration-150 border border-gray-700 cursor-pointer"
                    onClick={() => onSelectMail(mail.id)}
                >
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-semibold text-gray-100 truncate pr-2" title={unescapeHtml(mail.subject)}>
                            {unescapeHtml(mail.subject)}
                        </h3>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(mail.date)}</p>
                    </div>
                    <div className="text-xs text-gray-400 mb-1 truncate" title={unescapeHtml(mail.from)}>
                        {unescapeHtml(mail.from)}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                        {mail.snippet}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default MailList; 