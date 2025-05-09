'use client';

import { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SidebarNav from "@/components/SidebarNav";
import ThreadList from "@/components/ThreadList";
import ThreadDetailView from "@/components/ThreadDetailView";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

// Define needed types here or import from shared location
interface GmailLabel {
    id: string;
    name: string;
    type?: string;
    messagesUnread?: number;
    color?: { backgroundColor?: string; textColor?: string; };
}
interface LabelsApiResponse {
    labels?: GmailLabel[];
    error?: string;
}

// Define interfaces for Thread data
interface GmailThread { // Basic info returned by threads.list
    id: string;
    snippet: string;
    historyId: string;
    // Add enriched data if we fetch it later (subject, participants, date)
    subject?: string;
    from?: string;
}

interface ThreadsApiResponse {
    threads?: GmailThread[];
    nextPageToken?: string;
    resultSizeEstimate?: number;
    error?: string;
    labelIdsApplied?: string[];
}

// Define interfaces for Thread Detail data
interface GmailMessage { // Structure within threads.get response
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet?: string;
    historyId?: string;
    internalDate?: string;
    payload?: any; // Contains headers, body, parts etc.
    sizeEstimate?: number;
    raw?: string;
}

interface GmailDraft {
    id: string;
    message?: { // Drafts have a nested message stub
        id: string;
        threadId: string;
        labelIds?: string[];
    }
}

interface ThreadDetailData { // Combined data structure for a thread
    id: string;
    messages: GmailMessage[];
    historyId: string;
    snippet?: string;
    drafts?: GmailDraft[]; // Added drafts list
    // We might want to compute subject, participants etc. here from messages[0]
    subject?: string;
}

interface ThreadDetailApiResponse extends ThreadDetailData { // API response structure
    error?: string;
}

// Add an interface for the blank draft API response
interface BlankDraftApiResponse {
    message?: string;
    id?: string; // Draft ID
    messageId?: string; // Message ID associated with the draft
    error?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function DashboardPage() {
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [labelsError, setLabelsError] = useState<string | null>(null);
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>('INBOX');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // State for threads list
    const [threads, setThreads] = useState<GmailThread[]>([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(false);
    const [threadsError, setThreadsError] = useState<string | null>(null);
    const [threadsNextPageToken, setThreadsNextPageToken] = useState<string | null>(null);

    // State for thread detail
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [threadDetailData, setThreadDetailData] = useState<ThreadDetailData | null>(null);
    const [isLoadingThreadDetail, setIsLoadingThreadDetail] = useState(false);
    const [threadDetailError, setThreadDetailError] = useState<string | null>(null);

    // Add state for draft creation process
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);
    const [draftCreationResult, setDraftCreationResult] = useState<BlankDraftApiResponse | null>(null);

    // Fetch Labels
    async function fetchLabels() {
        setIsLoadingLabels(true);
        setLabelsError(null);
        try {
            const response = await fetch('/api/mail/labels');
            if (response.status === 401) {
                setIsAuthenticated(false);
                setIsLoadingLabels(false);
                return;
            }
            const data: LabelsApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error fetching labels: ${response.status}`);
            }
            setLabels(data.labels || []);
            setIsAuthenticated(true);
        } catch (err: any) {
            console.error("Error fetching labels:", err);
            setLabelsError(err.message || 'Failed to load labels.');
            setIsAuthenticated(false);
        }
        setIsLoadingLabels(false);
    }

    useEffect(() => {
        fetchLabels();
    }, []);

    // Fetch Threads List when selectedLabelId changes
    useEffect(() => {
        async function fetchThreads() {
            if (isAuthenticated === false) return; // Don't fetch if not authenticated

            setIsLoadingThreads(true);
            setThreadsError(null);
            setThreads([]); // Clear previous threads
            setThreadsNextPageToken(null); // Reset pagination
            // Also clear detail view when label changes
            setSelectedThreadId(null);
            setThreadDetailData(null);
            setThreadDetailError(null);

            let apiUrl = '/api/mail/threads';
            const params = new URLSearchParams();
            if (selectedLabelId) {
                params.append('label_ids', selectedLabelId);
            } else {
                params.append('label_ids', 'INBOX'); // Default to INBOX if no label selected
            }
            // Add other params like max_results if needed
            params.append('max_results', '30'); // Example: fetch 30 threads

            apiUrl += `?${params.toString()}`;

            try {
                const response = await fetch(apiUrl);
                const data: ThreadsApiResponse = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || `Error fetching threads: ${response.status}`);
                }
                setThreads(data.threads || []);
                setThreadsNextPageToken(data.nextPageToken || null);
                // TODO: Could potentially enrich thread data here (e.g., fetch latest message subject)
            } catch (err: any) {
                console.error("Error fetching threads:", err);
                setThreadsError(err.message || 'Failed to load threads.');
            }
            setIsLoadingThreads(false);
        }

        // Fetch immediately if authenticated, or wait for auth state to be confirmed true
        if (isAuthenticated === true) {
            fetchThreads();
        }

    }, [selectedLabelId, isAuthenticated]); // Re-fetch when label or auth state changes

    // Fetch Thread Detail when selectedThreadId changes
    useEffect(() => {
        async function fetchThreadDetail() {
            if (!selectedThreadId) {
                setThreadDetailData(null);
                return;
            }
            setIsLoadingThreadDetail(true);
            setThreadDetailError(null);
            setThreadDetailData(null);
            try {
                const response = await fetch(`/api/mail/threads/${selectedThreadId}`);
                const data: ThreadDetailApiResponse = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || `Error fetching thread detail: ${response.status}`);
                }
                // Add subject extracted from first message for easier display
                const firstMessagePayload = data.messages?.[0]?.payload;
                const headers = firstMessagePayload?.headers || [];
                const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
                setThreadDetailData({ ...data, subject });
            } catch (err: any) {
                console.error("Error fetching thread detail:", err);
                setThreadDetailError(err.message || 'Failed to load thread detail.');
            }
            setIsLoadingThreadDetail(false);
        }
        fetchThreadDetail();
    }, [selectedThreadId]);

    const handleSelectLabel = (labelId: string | null) => {
        console.log("Selected Label:", labelId);
        setSelectedLabelId(labelId);
        // Fetching threads is now handled by the useEffect watching selectedLabelId
        // Clearing detail view is also handled in that useEffect
    };

    const handleCompose = async () => {
        console.log("Compose clicked - attempting to create blank draft...");
        setIsCreatingDraft(true);
        setDraftCreationResult(null); // Clear previous result
        try {
            const response = await fetch('/api/mail/drafts/create_blank', {
                method: 'POST',
                // No body needed for this request
            });
            const data: BlankDraftApiResponse = await response.json();
            setDraftCreationResult(data);

            if (!response.ok) {
                throw new Error(data.error || `Error creating blank draft: ${response.status}`);
            }

            alert(`Blank draft created successfully! Draft ID: ${data.id}, Message ID: ${data.messageId}`);
            // TODO: Future enhancement - open a compose modal or navigate to a compose view with this draft ID.
            console.log("Blank draft creation successful:", data);

        } catch (err: any) {
            console.error("Error creating blank draft:", err);
            setDraftCreationResult({ error: err.message || 'Failed to create blank draft.' });
            alert(`Error creating blank draft: ${err.message || 'Unknown error'}`);
        }
        setIsCreatingDraft(false);
    };

    const handleSelectThread = (threadId: string) => {
        console.log("Selecting Thread ID:", threadId);
        setSelectedThreadId(threadId);
    };

    // Render login prompt if not authenticated
    if (isAuthenticated === false) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4 bg-gray-900">
                <p className="text-red-400 text-lg mb-4">
                    {labelsError || 'Authentication required. Please login.'}
                </p>
                <a href={GOOGLE_LOGIN_URL} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md">
                    Login with Google
                </a>
            </div>
        );
    }

    // Show loading state while determining auth/loading labels
    if (isAuthenticated === null || isLoadingLabels) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-100">
                <p className="text-xl">Loading Dashboard...</p>
            </div>
        );
    }

    // Main Dashboard Layout
    return (
        <div className="flex h-screen w-screen items-stretch overflow-hidden bg-gray-900 text-gray-100">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Sidebar Panel */}
                <ResizablePanel defaultSize={20} maxSize={30} minSize={15} className="flex flex-col bg-gray-800 border-r border-gray-700">
                    <SidebarNav
                        labels={labels}
                        onSelectLabel={handleSelectLabel}
                        onComposeClick={handleCompose}
                        isLoadingLabels={isLoadingLabels}
                        labelsError={labelsError}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-gray-600 w-1.5 hover:bg-blue-500 transition-colors" />
                {/* Thread List Panel - Conditionally change size if detail is open */}
                <ResizablePanel defaultSize={selectedThreadId ? 35 : 80} minSize={25} className="flex flex-col bg-gray-900">
                    <ThreadList
                        threads={threads}
                        isLoading={isLoadingThreads}
                        error={threadsError}
                        onSelectThread={handleSelectThread}
                        selectedLabelId={selectedLabelId}
                    />
                </ResizablePanel>

                {/* Thread Detail Panel - Only show if a thread is selected */}
                {selectedThreadId && (
                    <>
                        <ResizableHandle withHandle className="bg-gray-600 w-1.5 hover:bg-blue-500 transition-colors" />
                        <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col bg-gray-850 border-l border-gray-700">
                            <div className="p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <h2 className="text-xl font-semibold mb-4 text-blue-300">Thread Detail</h2>
                                {isLoadingThreadDetail && (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                                        <p className="ml-2">Loading thread...</p>
                                    </div>
                                )}
                                {threadDetailError && <p className="text-red-400">Error: {threadDetailError}</p>}

                                {!isLoadingThreadDetail && !threadDetailError && (
                                    <ThreadDetailView
                                        threadData={threadDetailData}
                                        isLoading={isLoadingThreadDetail}
                                        error={threadDetailError}
                                    />
                                )}
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
} 