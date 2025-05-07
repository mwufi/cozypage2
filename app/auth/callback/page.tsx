'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Updated imports

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jwt = searchParams.get('jwt');

    useEffect(() => {
        async function storeTokenAndRedirect() {
            if (jwt) {
                try {
                    const response = await fetch('/api/auth/store-session', { // Updated endpoint name
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ jwt }),
                    });

                    if (response.ok) {
                        // Token stored successfully, redirect to the Drive page or dashboard
                        router.push('/drive');
                    } else {
                        // Handle error storing token
                        console.error('Failed to store session token');
                        // Redirect to an error page or login page with an error message
                        router.push('/login?error=session_store_failed');
                    }
                } catch (error) {
                    console.error('Error calling store-session API:', error);
                    router.push('/login?error=api_call_failed');
                }
            } else {
                // No JWT in query params, redirect to login or error page
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