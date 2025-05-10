import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('app_jwt');
    const jwt = tokenCookie?.value;

    if (!jwt) {
        return NextResponse.json(
            { error: 'Authentication required. Please login.' },
            { status: 401 }
        );
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const targetUrl = `${PYTHON_BACKEND_URL}/todos`;

    try {
        const backendResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const responseBody = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error('Error from Python backend (POST /todos):', backendResponse.status, responseBody);
            return NextResponse.json(
                { error: responseBody.detail || `Backend error: ${backendResponse.status}` },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(responseBody, { status: backendResponse.status });

    } catch (error: any) {
        console.error('Error in Next.js API route (POST /api/todos/POST):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route', details: error.message },
            { status: 500 }
        );
    }
} 