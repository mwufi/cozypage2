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
        const response = await fetch(`${backendUrl}/drive/`, { // Ensure trailing slash if your router expects it
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
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
            console.error('Error from Python backend (Drive API - GET files):', response.status, errorText.substring(0, 500));
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
            console.error('Received unexpected non-JSON response from backend (Drive API - GET files):', response.status, textData.substring(0, 500));
            return NextResponse.json(
                { error: 'Received unexpected non-JSON response from backend' },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error('Error in /api/drive Next.js route (GET files):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route' },
            { status: 500 }
        );
    }
}

// New POST function for creating a document
export async function POST(request: NextRequest) {
    const backendUrl = process.env.NODE_ENV === 'production'
        ? process.env.PROD_BACKEND_URL
        : 'http://localhost:8000';

    const tokenCookie = cookies().get('app_jwt');
    const jwt = tokenCookie?.value;

    if (!jwt) {
        return NextResponse.json(
            { error: 'Authentication required. Please login.' },
            { status: 401 }
        );
    }

    // Optional: Could take a title from the request body if needed
    // const { title } = await request.json(); 

    try {
        const response = await fetch(`${backendUrl}/drive/create_doc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json' // Though body is empty for now
            },
            // body: JSON.stringify({ title: title || 'New Document from Frontend' }) // If sending a title
        });

        if (response.status === 401) {
            const res = NextResponse.json(
                { error: 'Session expired or invalid. Please login again.' },
                { status: 401 }
            );
            res.cookies.set('app_jwt', '', { maxAge: -1, path: '/' });
            return res;
        }
        if (response.status === 403) { // Insufficient permissions
            return NextResponse.json(
                { error: 'Insufficient permissions on the backend. You may need to re-grant access with new scopes.' },
                { status: 403 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Drive API - POST create_doc):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error creating doc: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const data = await response.json(); // Expecting { message, id, title, link }
        return NextResponse.json(data, { status: response.status }); // Relay backend status (e.g., 201 Created)

    } catch (error) {
        console.error('Error in /api/drive Next.js route (POST create_doc):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route while creating doc' },
            { status: 500 }
        );
    }
} 