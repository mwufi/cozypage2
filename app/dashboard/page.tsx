'use client';

import { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SidebarNav from "@/components/SidebarNav";
import MailDisplay from "@/components/MailDisplay";
import Link from 'next/link';

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

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function DashboardPage() {
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [labelsError, setLabelsError] = useState<string | null>(null);
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>('INBOX'); // Default to INBOX
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Manage auth state

    // Fetch Labels
    async function fetchLabels() {
        setIsLoadingLabels(true);
        setLabelsError(null);
        try {
            const response = await fetch('/api/mail/labels');
            if (response.status === 401) {
                setIsAuthenticated(false); // Not logged in
                setIsLoadingLabels(false);
                return;
            }
            const data: LabelsApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error fetching labels: ${response.status}`);
            }
            setLabels(data.labels || []);
            setIsAuthenticated(true); // Assume authenticated if labels fetched ok
        } catch (err: any) {
            console.error("Error fetching labels:", err);
            setLabelsError(err.message || 'Failed to load labels.');
            setIsAuthenticated(false); // Assume error means not authenticated
        }
        setIsLoadingLabels(false);
    }

    useEffect(() => {
        fetchLabels();
        // Initial mail fetch is handled within MailDisplay based on selectedLabelId
    }, []);

    const handleSelectLabel = (labelId: string | null) => {
        console.log("Selected Label:", labelId);
        setSelectedLabelId(labelId);
        // MailDisplay component will automatically re-fetch when this prop changes
    };

    const handleCompose = () => {
        console.log("Compose clicked");
        // TODO: Implement compose modal/logic here or navigate
        alert("Compose functionality not yet implemented in this view.");
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
                {/* Mail Display Panel */}
                <ResizablePanel defaultSize={80} className="flex flex-col bg-gray-900">
                    {/* Pass selectedLabelId to MailDisplay */}
                    <MailDisplay selectedLabelId={selectedLabelId} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
} 