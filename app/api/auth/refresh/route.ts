import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    try {
        const response = await fetch(`${backendUrl}/auth/refresh_token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
        });

        const data = await response.json(); // Read body regardless of status

        if (response.status === 401) {
            const res = NextResponse.json(
                { error: data.detail || 'Session expired or invalid. Please login again.' },
                { status: 401 }
            );
            res.cookies.set('app_jwt', '', { maxAge: -1, path: '/' });
            return res;
        }
        if (response.status === 400) { // e.g., no refresh token available
            return NextResponse.json(
                { error: data.detail || 'Cannot refresh token.' },
                { status: 400 }
            );
        }

        if (!response.ok) {
            const errorText = data.detail || JSON.stringify(data);
            console.error('Error from Python backend (Refresh Token):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error refreshing token: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        // Relay successful response from backend
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Error in /api/auth/refresh Next.js route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route for refresh token' },
            { status: 500 }
        );
    }
} 