'use client';

import React, { useState, useEffect } from 'react';
import MailList, { MailItem } from '@/components/MailList';
import {
    Loader2
} from "lucide-react";

interface MailDisplayProps {
    selectedLabelId: string | null; // e.g., 'INBOX', or a user label ID
    onSelectMail: (mailId: string) => void; // Add this prop
}

interface MailApiResponse {
    messages?: MailItem[];
    error?: string;
    labelIdsApplied?: string[]; // To confirm which labels were used by backend
}

const MailDisplay: React.FC<MailDisplayProps> = ({ selectedLabelId, onSelectMail }) => {
    const [mails, setMails] = useState<MailItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [currentLabel, setCurrentLabel] = useState<string | null>(null); // For display purposes

    useEffect(() => {
        async function fetchMailForLabel(labelIdToFetch: string | null) {
            setIsLoading(true);
            setError(null);
            setMails([]); // Clear previous mails

            let apiUrl = '/api/mail/messages'; // Base URL for the new endpoint

            if (labelIdToFetch) {
                apiUrl += `?label_ids=${encodeURIComponent(labelIdToFetch)}`;
            } else {
                // Default to INBOX if null is explicitly passed, or handle as API default
                // The backend defaults to INBOX if no label_ids are passed, which is fine.
                // Or, explicitly send INBOX:
                apiUrl += `?label_ids=INBOX`;
            }
            // You can also add max_results here if needed, e.g., apiUrl += `&max_results=50`;

            try {
                const response = await fetch(apiUrl);
                const data: MailApiResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Error fetching mail: ${response.status} ${response.statusText}`);
                }
                setMails(data.messages || []);
                // if(data.labelIdsApplied) setCurrentLabel(data.labelIdsApplied.join(', '));

            } catch (err: any) {
                console.error("Error fetching mail:", err);
                setError(err.message || 'Failed to load messages.');
            }
            setIsLoading(false);
        }

        fetchMailForLabel(selectedLabelId);
    }, [selectedLabelId]); // Re-fetch when selectedLabelId changes

    // This internal handler is no longer needed if onSelectMail is passed down to MailList
    // const handleSelectMailInternal = (mailId: string) => {
    //     console.log("Selected Mail ID in MailDisplay:", mailId);
    //     // Now, MailDisplay itself doesn't decide what to do. It calls the passed-in prop.
    //     onSelectMail(mailId); 
    // };

    return (
        <div className="flex flex-col h-full">
            {/* Optional: Add a header to show currentLabel or selectedLabelId */}
            {/* <div className="p-2 border-b border-gray-700 text-sm text-gray-400">
                Displaying: {currentLabel || selectedLabelId || 'Default View'}
            </div> */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-8">Error: {error}</div>
                ) : (
                    // Pass the onSelectMail prop from DashboardPage down to MailList
                    <MailList mails={mails} onSelectMail={onSelectMail} />
                )}
            </div>
        </div>
    );
};

export default MailDisplay; 