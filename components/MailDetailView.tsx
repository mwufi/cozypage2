'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

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

// Helper function to decode base64url encoding (common in Gmail API for body data)
function base64UrlDecode(str: string): string {
    try {
        // Replace Base64URL specific characters
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with '=' characters if necessary
        while (base64.length % 4) {
            base64 += '=';
        }
        return atob(base64);
    } catch (e) {
        console.error("Base64Url decoding failed:", e);
        return ""; // Or handle error appropriately
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
        <div className="p-1 md:p-4 h-full text-sm">
            <div className="mb-4 pb-3 border-b border-gray-700">
                <h1 className="text-xl font-semibold text-gray-100 mb-1 break-all">{subject}</h1>
                <div className="text-xs text-gray-400">
                    <p><span className="font-semibold text-gray-300">From:</span> {from}</p>
                    <p><span className="font-semibold text-gray-300">To:</span> {to}</p>
                    {cc && <p><span className="font-semibold text-gray-300">CC:</span> {cc}</p>}
                    <p><span className="font-semibold text-gray-300">Date:</span> {new Date(date).toLocaleString()}</p>
                </div>
            </div>

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
    );
};

export default MailDetailView; 