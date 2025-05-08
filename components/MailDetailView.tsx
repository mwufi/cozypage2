'use client';

import React, { useState } from 'react';
import { Loader2, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This interface should ideally be shared or imported if defined elsewhere (e.g., DashboardPage)
interface MailDetail {
    id: string;
    threadId: string;
    snippet?: string;
    payload?: any; // The full payload from Gmail API
    subject?: string;
    from?: string;
    date?: string;
    // We might add more processed fields here like a clean body string
}

interface MailDetailViewProps {
    mailData: MailDetail | null;
    isLoading: boolean;
    error: string | null;
}

interface ReplyDraftApiResponse {
    message?: string;
    id?: string; // Draft ID
    messageId?: string; // Message ID associated with the draft
    threadId?: string;
    error?: string;
}

// Helper function to decode base64url encoding (common in Gmail API for body data)
function base64UrlDecode(str: string): string {
    try {
        // Replace Base64URL specific characters
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with '=' characters if necessary
        // The atob function decodes a base-64 encoded string.
        // The result is a binary string.
        const binaryString = atob(base64);
        // Convert binary string to Uint8Array
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        // Use TextDecoder to decode UTF-8 bytes into a JavaScript string
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error("Base64Url decoding or UTF-8 decoding failed:", e);
        // Attempt to return the original string if decoding fails, or a specific error message
        // This might happen if the content wasn't actually UTF-8 encoded base64.
        // For robustness, one might try other decodings or return the raw atob() output
        // but for most modern emails, UTF-8 is expected.
        try {
            return atob(str.replace(/-/g, '+').replace(/_/g, '/')); // Fallback to raw atob if TextDecoder fails
        } catch (innerE) {
            return "[Content decoding error]";
        }
    }
}

// Function to find and decode the email body from the payload
const getEmailBody = (payload: any): { type: 'html' | 'text', content: string } | null => {
    if (!payload) return null;

    if (payload.parts) {
        // Look for HTML part first
        const htmlPart = payload.parts.find((part: any) => part.mimeType === 'text/html');
        if (htmlPart && htmlPart.body && htmlPart.body.data) {
            return { type: 'html', content: base64UrlDecode(htmlPart.body.data) };
        }
        // Fallback to plain text part
        const textPart = payload.parts.find((part: any) => part.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
            return { type: 'text', content: base64UrlDecode(textPart.body.data) };
        }
    } else if (payload.body && payload.body.data) {
        // If not multipart, the body might be directly in payload.body
        // We assume it's html if mimeType suggests, otherwise treat as text as a fallback.
        if (payload.mimeType === 'text/html') {
            return { type: 'html', content: base64UrlDecode(payload.body.data) };
        } else if (payload.mimeType === 'text/plain') {
            return { type: 'text', content: base64UrlDecode(payload.body.data) };
        }
        // If mimeType is something else but body.data exists, it might be an attachment preview or other content.
        // For simplicity, we are not handling it here. Could also be a simple text email without explicit mimeType text/plain at the top level.
        // return { type: 'text', content: base64UrlDecode(payload.body.data) }; 
    }
    return null; // Or return a default message like "Body not found or format not supported"
};

const MailDetailView: React.FC<MailDetailViewProps> = ({ mailData, isLoading, error }) => {
    const [isCreatingReplyDraft, setIsCreatingReplyDraft] = useState(false);
    const [replyDraftResult, setReplyDraftResult] = useState<ReplyDraftApiResponse | null>(null);

    const handleDraftReply = async () => {
        if (!mailData || !mailData.id) {
            alert("Cannot create reply draft: mail data or ID is missing.");
            return;
        }
        console.log(`Attempting to create reply draft for message ID: ${mailData.id}`);
        setIsCreatingReplyDraft(true);
        setReplyDraftResult(null);
        try {
            const response = await fetch('/api/mail/drafts/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_message_id: mailData.id }),
            });
            const data: ReplyDraftApiResponse = await response.json();
            setReplyDraftResult(data);

            if (!response.ok) {
                throw new Error(data.error || `Error creating reply draft: ${response.status}`);
            }
            alert(`Reply draft created successfully! Draft ID: ${data.id}. It is part of thread: ${data.threadId}`);
            console.log("Reply draft creation successful:", data);
            // TODO: Future: Open compose modal with this draft ID

        } catch (err: any) {
            console.error("Error creating reply draft:", err);
            setReplyDraftResult({ error: err.message || 'Failed to create reply draft.' });
            alert(`Error creating reply draft: ${err.message || 'Unknown error'}`);
        }
        setIsCreatingReplyDraft(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="ml-2 text-gray-300">Loading email details...</p>
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 p-4">Error loading email: {error}</p>;
    }

    if (!mailData) {
        return <p className="text-gray-500 p-4">Select an email to view its details.</p>;
    }

    // Extract headers for display (more robust parsing can be added)
    const headers = mailData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || mailData.subject || 'No Subject';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || mailData.from || 'N/A';
    const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || mailData.date || 'N/A';
    const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || 'N/A';
    const cc = headers.find((h: any) => h.name.toLowerCase() === 'cc')?.value || null;

    const bodyInfo = getEmailBody(mailData.payload);

    return (
        <div className="p-1 md:p-4 h-full text-sm flex flex-col">
            <div className="mb-2 pb-2 border-b border-gray-700">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-xl font-semibold text-gray-100 break-all truncate pr-2" title={subject}>{subject}</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDraftReply}
                        disabled={isCreatingReplyDraft}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isCreatingReplyDraft ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                            <MessageSquareReply className="mr-1 h-3 w-3" />
                        )}
                        Reply
                    </Button>
                </div>
                <div className="text-xs text-gray-400">
                    <p><span className="font-semibold text-gray-300">From:</span> {from}</p>
                    <p><span className="font-semibold text-gray-300">To:</span> {to}</p>
                    {cc && <p><span className="font-semibold text-gray-300">CC:</span> {cc}</p>}
                    <p><span className="font-semibold text-gray-300">Date:</span> {new Date(date).toLocaleString()}</p>
                </div>
            </div>

            {replyDraftResult && !replyDraftResult.error && (
                <div className="mb-2 p-2 text-xs bg-green-800 border border-green-700 rounded-md text-green-200">
                    {replyDraftResult.message} Draft ID: {replyDraftResult.id}
                </div>
            )}
            {replyDraftResult && replyDraftResult.error && (
                <div className="mb-2 p-2 text-xs bg-red-800 border border-red-700 rounded-md text-red-200">
                    Error creating reply: {replyDraftResult.error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {bodyInfo ? (
                    bodyInfo.type === 'html' ? (
                        // Render HTML content safely. Using dangerouslySetInnerHTML requires trusting the source.
                        // For user emails, consider an HTML sanitizer library (like DOMPurify) before rendering.
                        <div
                            className="prose prose-sm prose-invert max-w-none gmail-html-body"
                            dangerouslySetInnerHTML={{ __html: bodyInfo.content }}
                        />
                    ) : (
                        <pre className="whitespace-pre-wrap break-words text-gray-200">{bodyInfo.content}</pre>
                    )
                ) : mailData.snippet ? (
                    <>
                        <p className="text-gray-300 mb-2">Could not render full body. Displaying snippet:</p>
                        <p className="text-gray-400 italic">{mailData.snippet}</p>
                    </>
                ) : (
                    <p className="text-gray-500">Email body not found or format not supported.</p>
                )}
            </div>
        </div>
    );
};

export default MailDetailView; 