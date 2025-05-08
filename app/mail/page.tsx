'use client';

import { useEffect, useState, FormEvent } from 'react';
import MailList, { MailItem } from '@/components/MailList';
import Link from 'next/link';

interface GmailLabel {
    id: string;
    name: string;
    messageListVisibility?: string;
    labelListVisibility?: string;
    type?: string; // 'system' or 'user'
    messagesTotal?: number;
    messagesUnread?: number;
    threadsTotal?: number;
    threadsUnread?: number;
    color?: { textColor: string; backgroundColor: string; };
}

interface MailApiResponse {
    messages?: MailItem[];
    resultSizeEstimate?: number;
    error?: string;
}

interface LabelsApiResponse {
    labels?: GmailLabel[];
    error?: string;
}

interface DraftApiResponse {
    message?: string;
    id?: string;
    messageId?: string;
    error?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function MailPage() {
    const [mails, setMails] = useState<MailItem[]>([]);
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [labelsError, setLabelsError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [totalMessages, setTotalMessages] = useState<number>(0);

    const [showComposeModal, setShowComposeModal] = useState(false);
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftSuccessMessage, setDraftSuccessMessage] = useState<string | null>(null);
    const [draftForm, setDraftForm] = useState({ to: '', subject: '', body: '' });

    async function fetchMail(maxResults = 10) {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/mail/inbox?max_results=${maxResults}`);
            if (response.status === 401) {
                setIsAuthenticated(false);
                setError('Authentication required for Mail. Please login.');
                setIsLoading(false);
                return;
            }
            const data: MailApiResponse = await response.json();
            if (!response.ok) {
                setIsAuthenticated(false);
                throw new Error(data.error || `Error fetching mail: ${response.status}`);
            }
            setMails(data.messages || []);
            setTotalMessages(data.resultSizeEstimate || 0);
            setIsAuthenticated(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load mail.');
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }

    async function fetchLabels() {
        setIsLoadingLabels(true);
        setLabelsError(null);
        try {
            const response = await fetch('/api/mail/labels');
            if (response.status === 401 && !isAuthenticated) {
                setIsAuthenticated(false);
                setError('Authentication required for Labels. Please login.');
                setIsLoadingLabels(false);
                return;
            }
            const data: LabelsApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error fetching labels: ${response.status}`);
            }
            setLabels(data.labels || []);
            if (isAuthenticated === null && data.labels) setIsAuthenticated(true);
        } catch (err: any) {
            setLabelsError(err.message || 'Failed to load labels.');
        }
        setIsLoadingLabels(false);
    }

    useEffect(() => {
        if (isAuthenticated === null) {
            fetchMail();
            fetchLabels();
        } else if (isAuthenticated) {
            fetchMail();
            fetchLabels();
        }
    }, [isAuthenticated]);

    const handleDraftInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDraftForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateDraft = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreatingDraft(true);
        setDraftError(null);
        setDraftSuccessMessage(null);
        try {
            const response = await fetch('/api/mail/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftForm),
            });
            const data: DraftApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error creating draft: ${response.status}`);
            }
            setDraftSuccessMessage(data.message || 'Draft created successfully!');
            setDraftForm({ to: '', subject: '', body: '' });
            setShowComposeModal(false);
        } catch (err: any) {
            setDraftError(err.message || 'Could not create draft.');
        }
        setIsCreatingDraft(false);
    };

    if ((isLoading || isLoadingLabels) && isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading Mail Page...</p></div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <p className="text-red-500 text-lg mb-4">
                    {error || labelsError || 'You are not authorized. Please login.'}
                </p>
                <a href={GOOGLE_LOGIN_URL} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md">
                    Login with Google
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 text-gray-100 bg-gray-800 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-bold text-white">Your Gmail</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Approx. {totalMessages} messages in Inbox</span>
                    <Link href="/api/auth/logout" legacyBehavior>
                        <a className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md">
                            Logout
                        </a>
                    </Link>
                </div>
            </div>

            {/* Display general error first if it exists */}
            {error && (
                <div className="bg-red-700 border border-red-900 text-white px-4 py-3 rounded relative mb-4 shadow-lg" role="alert">
                    <strong className="font-bold">Mail Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-3">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-3">Labels</h2>
                    {isLoadingLabels ? (
                        <p className="text-gray-400">Loading labels...</p>
                    ) : labelsError ? (
                        <p className="text-red-400">Error: {labelsError}</p>
                    ) : labels.length > 0 ? (
                        <ul className="space-y-1">
                            {labels.filter(l => l.type === 'user' || ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH'].includes(l.id)).map(label => (
                                <li key={label.id} className="text-sm p-2 rounded hover:bg-gray-700 cursor-pointer 
                                            border-l-4 hover:border-blue-400 transition-all duration-150"
                                    style={{ borderColor: label.color?.backgroundColor || 'transparent' }} >
                                    {label.name}
                                    {label.messagesUnread && label.messagesUnread > 0 &&
                                        <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">{label.messagesUnread}</span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No labels found.</p>
                    )}
                </div>

                <div className="md:col-span-9">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-3">Inbox</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><p className="text-lg text-gray-400">Fetching messages...</p></div>
                    ) : !error && mails.length > 0 ? (
                        <MailList mails={mails} />
                    ) : !error ? (
                        <p className="text-gray-400 text-center py-10">No messages found in your inbox.</p>
                    ) : null /* Error already displayed above mail section */}
                </div>
            </div>
        </div>
    );
} 