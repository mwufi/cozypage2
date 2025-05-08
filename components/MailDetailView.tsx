'use client';

import React, { useState } from 'react';
import { Loader2, MessageSquareReply, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Interfaces (Should be defined/imported consistently) ---
interface GmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet?: string;
    historyId?: string;
    internalDate?: string;
    payload?: any;
    sizeEstimate?: number;
    raw?: string;
}

interface GmailDraft {
    id: string;
    message?: {
        id: string;
        threadId: string;
        labelIds?: string[];
    }
}

interface ThreadDetailData {
    id: string;
    messages: GmailMessage[];
    historyId: string;
    snippet?: string;
    drafts?: GmailDraft[];
    subject?: string;
}

interface ThreadDetailViewProps {
    threadData: ThreadDetailData | null;
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

// --- Helper Functions (base64UrlDecode, getEmailBody - remain the same) ---
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

// --- Individual Message/Draft Renderer ---
// Extracted rendering logic for a single message/draft card
const MessageCard: React.FC<{ message: GmailMessage, isDraft?: boolean }> = ({ message, isDraft = false }) => {
    const headers = message.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'N/A';
    const date = message.internalDate ? new Date(parseInt(message.internalDate)).toLocaleString() : 'N/A';
    const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || 'N/A';
    const bodyInfo = getEmailBody(message.payload);
    const [isExpanded, setIsExpanded] = useState(false);

    // Use snippet as fallback if body parsing fails
    const displayContent = bodyInfo ? bodyInfo.content : message.snippet;
    const contentType = bodyInfo ? bodyInfo.type : 'text';

    return (
        <div className={`p-3 rounded border ${isDraft ? 'border-yellow-600 bg-yellow-900 bg-opacity-20' : 'border-gray-700 bg-gray-800'} mb-3 shadow-sm`}>
            <div className="flex justify-between items-center mb-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="text-xs text-gray-400 truncate pr-2">
                    <span className="font-semibold text-gray-300">{isDraft ? 'Draft - To:' : 'From:'}</span> {isDraft ? to : from}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{date}</span>
            </div>

            {isDraft && (
                <p className="text-xs text-yellow-400 font-semibold mb-1">Subject: {subject}</p>
            )}

            {/* Show snippet or short preview initially */}
            {!isExpanded && (
                <p className="text-xs text-gray-400 line-clamp-2 cursor-pointer" onClick={() => setIsExpanded(true)}>
                    {message.snippet || "(No snippet)"}
                </p>
            )}

            {/* Show full body when expanded */}
            {isExpanded && displayContent && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                    {contentType === 'html' ? (
                        <div
                            className="prose prose-sm prose-invert max-w-none gmail-html-body text-xs"
                            dangerouslySetInnerHTML={{ __html: displayContent }}
                        />
                    ) : (
                        <pre className="whitespace-pre-wrap break-words text-gray-200 text-xs">{displayContent}</pre>
                    )}
                </div>
            )}
            {isExpanded && !displayContent && (
                <p className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-500">(Could not display body)</p>
            )}
            {isDraft && isExpanded && (
                <Button variant="link" size="sm" className="text-xs text-yellow-400 p-0 h-auto mt-1">
                    Edit Draft (not implemented)
                </Button>
            )}
        </div>
    );
};

// --- Main ThreadDetailView Component ---
const ThreadDetailView: React.FC<ThreadDetailViewProps> = ({ threadData, isLoading, error }) => {
    const [isCreatingReplyDraft, setIsCreatingReplyDraft] = useState(false);
    const [replyDraftResult, setReplyDraftResult] = useState<ReplyDraftApiResponse | null>(null);

    // handleDraftReply remains the same, but now uses threadData.id (latest message) ?
    // Or should reply be associated with the thread, not a specific message?
    // Let's assume we reply to the *thread* (using the latest message for context if needed by backend)
    // The backend currently takes original_message_id. Let's use the *last* message ID from the thread for the reply.
    const handleDraftReply = async () => {
        const lastMessage = threadData?.messages?.[threadData.messages.length - 1];
        if (!threadData || !lastMessage || !lastMessage.id) {
            alert("Cannot create reply draft: thread data or last message ID is missing.");
            return;
        }
        const original_message_id = lastMessage.id;
        console.log(`Attempting to create reply draft for last message ID: ${original_message_id} in thread ${threadData.id}`);
        setIsCreatingReplyDraft(true);
        setReplyDraftResult(null);
        try {
            const response = await fetch('/api/mail/drafts/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_message_id }),
            });
            const data: ReplyDraftApiResponse = await response.json();
            setReplyDraftResult(data);
            if (!response.ok) throw new Error(data.error || `Error creating reply draft: ${response.status}`);
            alert(`Reply draft created successfully! Draft ID: ${data.id}. It is part of thread: ${data.threadId}`);
            console.log("Reply draft creation successful:", data);
            // TODO: Refresh thread data to show the new draft? Or manually add it to state?
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

    if (!threadData) {
        return <p className="text-gray-500 p-4">Select a conversation to view.</p>;
    }

    // Combine messages and drafts, maybe sort by date later if needed
    const combinedItems = [
        ...(threadData.messages || []).map(msg => ({ item: msg, type: 'message' as const })),
        ...(threadData.drafts || []).map(draft => ({ item: draft, type: 'draft' as const }))
    ];
    // TODO: Sort combinedItems by date (requires parsing internalDate or draft message date)

    return (
        <div className="p-1 md:p-4 h-full flex flex-col">
            {/* Thread Header */}
            <div className="mb-3 pb-3 border-b border-gray-700">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-lg font-semibold text-gray-100 truncate pr-2" title={threadData.subject}>{threadData.subject}</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDraftReply}
                        disabled={isCreatingReplyDraft || !threadData.messages || threadData.messages.length === 0}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isCreatingReplyDraft ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareReply className="mr-1 h-3 w-3" />}
                        Reply
                    </Button>
                </div>
                {/* Display feedback for reply action */}
                {replyDraftResult && !replyDraftResult.error && (
                    <div className="mt-1 p-1.5 text-xs bg-green-800 border border-green-700 rounded-md text-green-200">
                        {replyDraftResult.message} Draft ID: {replyDraftResult.id}
                    </div>
                )}
                {replyDraftResult && replyDraftResult.error && (
                    <div className="mt-1 p-1.5 text-xs bg-red-800 border border-red-700 rounded-md text-red-200">
                        Error creating reply: {replyDraftResult.error}
                    </div>
                )}
            </div>

            {/* List of Messages and Drafts */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
                {combinedItems.map(({ item, type }) => (
                    type === 'message'
                        ? <MessageCard key={item.id} message={item as GmailMessage} />
                        : <MessageCard key={item.id} message={(item as GmailDraft).message as GmailMessage} isDraft={true} /> // Pass draft message stub
                ))}
                {combinedItems.length === 0 && (
                    <p className="text-gray-500">No messages or drafts in this conversation.</p>
                )}
            </div>
        </div>
    );
};

export default ThreadDetailView; // Export with new name