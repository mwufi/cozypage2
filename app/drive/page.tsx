'use client';

import { useEffect, useState } from 'react';
import DriveFileList, { DriveFile } from '@/components/DriveFileList';
import Link from 'next/link';

interface DriveApiResponse {
    items?: DriveFile[];
    error?: string;
    message?: string;
    id?: string;
    title?: string;
    link?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function DrivePage() {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isCreatingDoc, setIsCreatingDoc] = useState(false);
    const [createDocMessage, setCreateDocMessage] = useState<string | null>(null);

    async function fetchDriveFiles() {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/drive');

            if (response.status === 401) {
                setIsAuthenticated(false);
                setError('Authentication required. Please login.');
                setIsLoading(false);
                return;
            }

            const data: DriveApiResponse = await response.json();

            if (!response.ok) {
                setIsAuthenticated(false);
                throw new Error(data.error || `Error: ${response.status}`);
            }

            setFiles(data.items || []);
            setIsAuthenticated(true);
        } catch (err: any) {
            console.error('Failed to fetch drive files:', err);
            setError(err.message || 'Failed to load files. Please try again.');
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchDriveFiles();
    }, []);

    const handleCreateNewDoc = async () => {
        setIsCreatingDoc(true);
        setCreateDocMessage(null);
        setError(null);
        try {
            const response = await fetch('/api/drive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data: DriveApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error creating document: ${response.status}`);
            }
            setCreateDocMessage(`${data.message} New doc: ${data.title} (ID: ${data.id}). `);
            if (data.link) {
                setCreateDocMessage(prev => prev + `Link: <a href="${data.link}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">Open Doc</a>`);
            }
            fetchDriveFiles();
        } catch (err: any) {
            setError(err.message || 'Could not create document.');
        }
        setIsCreatingDoc(false);
    };

    if (isLoading || isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated || error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <p className="text-red-500 text-lg mb-4">
                    {error || 'You are not authorized to view this page. Please login.'}
                </p>
                <a
                    href={GOOGLE_LOGIN_URL}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md"
                >
                    Login with Google
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 text-gray-100 bg-gray-800 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-bold text-white">Your Google Drive Files</h1>
                <Link href="/api/auth/logout" legacyBehavior>
                    <a className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md">
                        Logout
                    </a>
                </Link>
            </div>

            {error && (
                <div className="bg-red-700 border border-red-900 text-white px-4 py-3 rounded relative mb-4 shadow-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline" dangerouslySetInnerHTML={{ __html: error }}></span>
                </div>
            )}
            {createDocMessage && (
                <div className="bg-green-700 border border-green-900 text-white px-4 py-3 rounded relative mb-4 shadow-lg" role="alert">
                    <strong className="font-bold">Success: _</strong>
                    <span className="block sm:inline" dangerouslySetInnerHTML={{ __html: createDocMessage }}></span>
                </div>
            )}

            <div className="mb-6">
                <button
                    onClick={handleCreateNewDoc}
                    disabled={isCreatingDoc}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md disabled:bg-gray-500 flex items-center justify-center"
                >
                    {isCreatingDoc ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </>
                    ) : (
                        'Create New Google Doc'
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><p className="text-lg text-gray-400">Refreshing files...</p></div>
            ) : files.length > 0 ? (
                <DriveFileList files={files} />
            ) : (
                <p className="text-gray-400 text-center py-10">No files found in your Google Drive or access might be limited.</p>
            )}
        </div>
    );
} 