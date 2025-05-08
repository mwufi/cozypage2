'use client';

import { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SidebarNav from "@/components/SidebarNav";
import MailDisplay from "@/components/MailDisplay";
import MailDetailView from "@/components/MailDetailView";
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

// Define type for a single mail item detail (can be expanded based on API response)
interface MailDetail {
    id: string;
    threadId: string;
    snippet: string;
    payload?: any; // The full payload from Gmail API (headers, body, parts, etc.)
    subject?: string; // Extracted for convenience if needed, or derive from payload
    from?: string;
    date?: string;
    // Add more specific fields as you parse the payload
}

interface MailDetailApiResponse {
    // Assuming the API returns the full message object from Gmail
    // This might be more complex, adjust as per actual API response structure
    id?: string;
    threadId?: string;
    snippet?: string;
    payload?: any;
    error?: string;
    // ... any other fields from the Gmail API message resource ...
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function DashboardPage() {
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [labelsError, setLabelsError] = useState<string | null>(null);
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>('INBOX');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // State for selected mail detail
    const [selectedMailIdForDetail, setSelectedMailIdForDetail] = useState<string | null>(null);
    const [mailDetailData, setMailDetailData] = useState<MailDetail | null>(null);
    const [isLoadingMailDetail, setIsLoadingMailDetail] = useState(false);
    const [mailDetailError, setMailDetailError] = useState<string | null>(null);

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

    // Fetch Mail Detail when selectedMailIdForDetail changes
    useEffect(() => {
        async function fetchMailDetail() {
            if (!selectedMailIdForDetail) {
                setMailDetailData(null); // Clear data if no ID
                return;
            }
            setIsLoadingMailDetail(true);
            setMailDetailError(null);
            setMailDetailData(null); // Clear previous data before fetching
            try {
                const response = await fetch(`/api/mail/messages/${selectedMailIdForDetail}`);
                const data: MailDetailApiResponse = await response.json(); // Adjust type based on actual API response
                if (!response.ok) {
                    throw new Error(data.error || `Error fetching mail detail: ${response.status}`);
                }
                // Here, you might want to process/transform `data` into `MailDetail` format if they differ
                setMailDetailData(data as MailDetail);
            } catch (err: any) {
                console.error("Error fetching mail detail:", err);
                setMailDetailError(err.message || 'Failed to load mail detail.');
            }
            setIsLoadingMailDetail(false);
        }
        fetchMailDetail();
    }, [selectedMailIdForDetail]);

    const handleSelectLabel = (labelId: string | null) => {
        console.log("Selected Label:", labelId);
        setSelectedLabelId(labelId);
        setSelectedMailIdForDetail(null); // Clear mail detail when changing label
        setMailDetailData(null);
        setMailDetailError(null);
    };

    const handleCompose = () => {
        console.log("Compose clicked");
        alert("Compose functionality not yet implemented in this view.");
    };

    const handleViewMailDetail = (mailId: string) => {
        console.log("Viewing Mail ID:", mailId);
        setSelectedMailIdForDetail(mailId);
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
                {/* Mail List Panel - Conditionally change size if detail is open */}
                <ResizablePanel defaultSize={selectedMailIdForDetail ? 35 : 80} minSize={25} className="flex flex-col bg-gray-900">
                    <MailDisplay
                        selectedLabelId={selectedLabelId}
                        onSelectMail={handleViewMailDetail}
                    />
                </ResizablePanel>

                {/* Mail Detail Panel - Only show if a mail is selected */}
                {selectedMailIdForDetail && (
                    <>
                        <ResizableHandle withHandle className="bg-gray-600 w-1.5 hover:bg-blue-500 transition-colors" />
                        <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col bg-gray-850 border-l border-gray-700">
                            <div className="p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <h2 className="text-xl font-semibold mb-4 text-blue-300">Mail Detail</h2>
                                {isLoadingMailDetail && (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                                        <p className="ml-2">Loading email...</p>
                                    </div>
                                )}
                                {mailDetailError && <p className="text-red-400">Error: {mailDetailError}</p>}

                                {!isLoadingMailDetail && !mailDetailError && (
                                    <MailDetailView
                                        mailData={mailDetailData}
                                        isLoading={isLoadingMailDetail}
                                        error={mailDetailError}
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