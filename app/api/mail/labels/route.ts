import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    try {
        const response = await fetch(`${backendUrl}/gmail/labels`, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
        });

        if (response.status === 401) {
            const res = NextResponse.json(
                { error: 'Session expired or invalid. Please login again.' },
                { status: 401 }
            );
            res.cookies.set('app_jwt', '', { maxAge: -1, path: '/' });
            return res;
        }
        if (response.status === 403) {
            return NextResponse.json(
                { error: 'Insufficient permissions for Gmail labels on the backend.' },
                { status: 403 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Gmail API - GET labels):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error fetching Gmail labels: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            const textData = await response.text();
            console.error('Received unexpected non-JSON response from backend (Gmail API - GET labels):', response.status, textData.substring(0, 500));
            return NextResponse.json(
                { error: 'Received unexpected non-JSON response from backend' },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error('Error in /api/mail/labels Next.js route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route for mail labels' },
            { status: 500 }
        );
    }
} 