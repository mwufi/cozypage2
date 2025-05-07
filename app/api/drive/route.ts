import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const backendUrl = process.env.NODE_ENV === 'production'
        ? process.env.PROD_BACKEND_URL // You'll need to set this in your production environment
        : 'http://localhost:8000';

    try {
        const response = await fetch(`${backendUrl}/drive`, {
            redirect: 'manual', // Prevent fetch from automatically following redirects
            headers: {
                // Attempt to forward any cookies received by this Next.js API route.
                // Note: This will only forward cookies set for the Next.js app's domain (e.g., localhost:3000).
                // It won't inherently forward cookies from the Python backend's domain (localhost:8000)
                // unless specific cross-domain cookie configurations are in place (which is uncommon for HttpOnly session cookies).
                // The broader authentication loop issue will be addressed separately.
                'Cookie': request.headers.get('cookie') || '',
            }
        });

        // Check if the Python backend is redirecting (e.g., to its /authorize endpoint)
        if (response.status === 302 || response.status === 303 || response.status === 307) {
            // If backend redirects, it means authentication is required.
            // Return a 401 to the client-side page (app/drive/page.tsx),
            // which has logic to redirect the user to the Python backend's /authorize URL.
            return NextResponse.json(
                { error: 'Authentication required. Redirecting to login...', redirectToBackendAuth: true },
                { status: 401 }
            );
        }

        if (!response.ok) {
            // Handle other non-redirect errors from the backend
            const errorText = await response.text(); // Read error as text first
            console.error('Error from Python backend (not a redirect):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error: ${response.status}` },
                { status: response.status }
            );
        }

        // If response is OK and not a redirect, check content type before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            // Received a 2xx response, but it's not JSON. This is unexpected.
            const textData = await response.text();
            console.error('Received unexpected non-JSON 2xx response from backend:', response.status, textData.substring(0, 500));
            return NextResponse.json(
                { error: 'Received unexpected non-JSON response from backend' },
                { status: 502 } // Bad Gateway, as the backend gave an unexpected response format
            );
        }

    } catch (error) {
        console.error('Error in /api/drive Next.js route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route' },
            { status: 500 }
        );
    }
} 