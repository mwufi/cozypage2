import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('app_jwt');
    const jwt = tokenCookie?.value;

    if (!jwt) {
        return NextResponse.json(
            { error: 'Authentication required. Please login.' },
            { status: 401 }
        );
    }

    const targetUrl = `${PYTHON_BACKEND_URL}/todos`;

    try {
        const backendResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
        });

        const responseBody = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error('Error from Python backend (GET /todos):', backendResponse.status, responseBody);
            return NextResponse.json(
                { error: responseBody.detail || `Backend error: ${backendResponse.status}` },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(responseBody, { status: backendResponse.status });

    } catch (error: any) {
        console.error('Error in Next.js API route (GET /api/todos/GET):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route', details: error.message },
            { status: 500 }
        );
    }
} 