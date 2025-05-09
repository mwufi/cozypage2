'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RefreshResponse {
    message?: string;
    new_expiry?: string;
    error?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function RefreshTokenDemoPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RefreshResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRefreshToken = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            // We need an API route to forward the JWT cookie
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
            });
            const data: RefreshResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error: ${response.status}`);
            }
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to trigger token refresh.');
            // Check if the error message indicates needing login
            if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('login again') || err.message.toLowerCase().includes('authentication required'))) {
                setError("Authentication required or session expired. Please login again.");
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto p-4 text-gray-100 bg-gray-800 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-bold text-white">Demo: Refresh Google Token</h1>
                <Link href="/api/auth/logout" legacyBehavior>
                    <a className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md">Logout</a>
                </Link>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <p className="mb-4 text-gray-300">
                    This page demonstrates manually triggering the refresh of your Google OAuth access token on the backend.
                    The backend automatically refreshes tokens when needed for API calls, but this allows explicit testing.
                </p>
                <button
                    onClick={handleRefreshToken}
                    disabled={isLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md disabled:bg-gray-500 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Refreshing...
                        </>
                    ) : (
                        'Refresh Google Token Now'
                    )}
                </button>

                {error && (
                    <div className="mt-6 bg-red-700 border border-red-900 text-white px-4 py-3 rounded relative shadow-lg" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        {error.includes('Authentication required') &&
                            <div className="mt-2">
                                <a href={GOOGLE_LOGIN_URL} className="text-sm text-blue-300 hover:text-blue-200 underline font-semibold">
                                    Login with Google
                                </a>
                            </div>
                        }
                    </div>
                )}
                {result && (
                    <div className="mt-6 bg-green-700 border border-green-900 text-white px-4 py-3 rounded relative shadow-lg" role="alert">
                        <strong className="font-bold">Success: </strong>
                        <span className="block sm:inline">{result.message} {result.new_expiry ? `(New expiry: ${new Date(result.new_expiry).toLocaleString()})` : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
} 