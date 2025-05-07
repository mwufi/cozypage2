'use client';

import { useEffect, useState } from 'react';
import DriveFileList, { DriveFile } from '@/components/DriveFileList';
import Link from 'next/link';

interface DriveApiResponse {
    items?: DriveFile[];
    error?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function DrivePage() {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
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

        fetchDriveFiles();
    }, []);

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
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Your Google Drive Files</h1>
                <Link href="/api/auth/logout" legacyBehavior>
                    <a className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        Logout
                    </a>
                </Link>
            </div>
            {files.length > 0 ? (
                <DriveFileList files={files} />
            ) : (
                <p className="text-gray-600">No files found in your Google Drive.</p>
            )}
        </div>
    );
} 