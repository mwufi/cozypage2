import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const backendUrl = process.env.NODE_ENV === 'production'
        ? process.env.PROD_BACKEND_URL
        : 'http://localhost:8000';

    const tokenCookie = cookies().get('app_jwt');
    const jwt = tokenCookie?.value;

    if (!jwt) {
        // If no JWT, it means the user is not authenticated with our app.
        // The Python backend will also reject if it requires auth and no token is sent.
        // We can return a 401 directly to prompt login on the frontend.
        return NextResponse.json(
            { error: 'Authentication required. Please login.' },
            { status: 401 }
        );
    }

    try {
        const response = await fetch(`${backendUrl}/drive`, {
            headers: {
                'Authorization': `Bearer ${jwt}`, // Send the JWT to the Python backend
                // Forward other necessary headers if any, but typically JWT is enough for auth.
            },
            // No need for redirect: 'manual' anymore, as the Python backend should now
            // return 401 if JWT is missing/invalid, not redirect to Google directly from this API call.
        });

        if (response.status === 401) {
            // This could happen if the JWT is expired/invalid on the backend, or Google token issue.
            // The frontend (DrivePage) should handle this by prompting re-login.
            // Clear the cookie if auth fails (e.g. token expired)
            // Note: cookies().delete() is for Server Actions. For Route Handlers, 
            // we need to set the cookie with an expired date or empty value via headers.
            // However, a simpler approach for now is to let the client handle login prompt.
            // For true deletion from a route handler, you'd send back a Set-Cookie header.
            const res = NextResponse.json(
                { error: 'Session expired or invalid. Please login again.' },
                { status: 401 }
            );
            // Example of how to set a cookie for deletion (though not strictly necessary if client handles re-auth)
            res.cookies.set('app_jwt', '', { maxAge: -1, path: '/' });
            return res;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Drive API):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            const textData = await response.text();
            console.error('Received unexpected non-JSON response from backend (Drive API):', response.status, textData.substring(0, 500));
            return NextResponse.json(
                { error: 'Received unexpected non-JSON response from backend' },
                { status: 502 }
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