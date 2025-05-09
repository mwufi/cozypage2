'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// New component to contain the logic
function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jwt = searchParams.get('jwt');

    useEffect(() => {
        async function storeTokenAndRedirect() {
            if (jwt) {
                try {
                    const response = await fetch('/api/auth/store-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ jwt }),
                    });

                    if (response.ok) {
                        router.push('/drive');
                    } else {
                        console.error('Failed to store session token');
                        router.push('/login?error=session_store_failed');
                    }
                } catch (error) {
                    console.error('Error calling store-session API:', error);
                    router.push('/login?error=api_call_failed');
                }
            } else {
                console.error('No JWT found in callback');
                router.push('/login?error=jwt_missing');
            }
        }

        storeTokenAndRedirect();
    }, [jwt, router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-lg text-gray-600">Processing authentication...</p>
            {/* You can add a spinner component here */}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><p className="text-lg text-gray-600">Loading...</p></div>}>
            <AuthCallbackContent />
        </Suspense>
    );
} 