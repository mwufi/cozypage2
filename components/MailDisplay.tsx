'use client';

import React, { useState, useEffect } from 'react';
import MailList, { MailItem } from '@/components/MailList';
import {
    Loader2
} from "lucide-react";

interface MailDisplayProps {
    selectedLabelId: string | null; // e.g., 'INBOX', or a user label ID
}

interface MailApiResponse {
    messages?: MailItem[];
    error?: string;
}

const MailDisplay: React.FC<MailDisplayProps> = ({ selectedLabelId }) => {
    const [mails, setMails] = useState<MailItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMailForLabel(labelId: string | null) {
            setIsLoading(true);
            setError(null);
            setMails([]); // Clear previous mails

            // Use appropriate API route based on label
            // For now, we only have the inbox route, need to adapt later for other labels
            const apiUrl = labelId === 'INBOX' || labelId === null // Default to inbox
                ? '/api/mail/inbox'
                : `/api/mail/list?labelId=${labelId}`; // Hypothetical future route

            // Temporary: Only fetch inbox for now until filtering API is implemented
            if (labelId !== 'INBOX' && labelId !== null) {
                setError(`Filtering by label '${labelId}' not yet implemented.`);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(apiUrl);
                const data: MailApiResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Error fetching mail: ${response.status}`);
                }
                setMails(data.messages || []);
            } catch (err: any) {
                console.error("Error fetching mail:", err);
                setError(err.message || 'Failed to load messages.');
                // Handle 401 specifically? Maybe redirect? Depends on where this component is used.
            }
            setIsLoading(false);
        }

        fetchMailForLabel(selectedLabelId);
    }, [selectedLabelId]); // Re-fetch when selectedLabelId changes

    const handleSelectMail = (mailId: string) => {
        console.log("Selected Mail ID:", mailId);
        // TODO: Implement logic to display mail details (e.g., open a new panel, modal)
        alert(`Selected Mail ID: ${mailId} - Detail view not implemented yet.`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Optional: Add toolbar here (Refresh, etc.) */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-8">Error: {error}</div>
                ) : (
                    <MailList mails={mails} onSelectMail={handleSelectMail} />
                )}
            </div>
        </div>
    );
};

export default MailDisplay; 