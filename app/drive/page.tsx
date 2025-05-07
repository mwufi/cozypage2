'use client';

import { useEffect, useState } from 'react';
import DriveFileList from '@/components/DriveFileList'; // Assuming this path

// Define a basic type for the file structure based on your example
// You might want to make this more comprehensive
export interface DriveFile {
    id: string;
    title: string;
    mimeType: string;
    modifiedDate: string;
    alternateLink: string;
    iconLink: string;
    fileSize?: string; // Optional as it might not always be present for Google Docs etc.
    ownerNames?: string[];
}

interface DriveApiResponse {
    items: DriveFile[];
    // Add other fields from the API response if needed
}

export default function DrivePage() {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDriveFiles() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/drive');
                if (!response.ok) {
                    if (response.status === 401) { // Unauthorized
                        // Attempt to redirect to Python backend authorize URL
                        // This assumes your Python backend is running on localhost:8000
                        // and its /authorize endpoint initiates the Google OAuth flow.
                        window.location.href = 'http://localhost:8000/authorize';
                        return; // Stop further processing as we are redirecting
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error: ${response.status}`);
                }
                const data: DriveApiResponse = await response.json();
                setFiles(data.items || []);
            } catch (err: any) {
                console.error('Failed to fetch drive files:', err);
                setError(err.message || 'Failed to load files. Please try again.');
            }
            setIsLoading(false);
        }

        fetchDriveFiles();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">Loading Drive files...</p>
                {/* You can add a spinner component here */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button
                    onClick={() => window.location.href = 'http://localhost:8000/authorize'}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Login with Google
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Google Drive Files</h1>
            {files.length > 0 ? (
                <DriveFileList files={files} />
            ) : (
                <p className="text-gray-600">No files found or you may need to authorize access.</p>
            )}
        </div>
    );
} 