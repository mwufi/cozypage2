import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const targetUrl = `${PYTHON_BACKEND_URL}/gmail/drafts/create_blank`;

    try {
        const backendResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appToken}`,
                // Content-Type is not strictly needed for a POST with no body,
                // but can be included if preferred or if the backend expects it.
                // 'Content-Type': 'application/json', 
            },
            // No body is sent for this specific request
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.detail || 'Error creating blank draft via backend' },
                { status: backendResponse.status }
            );
        }
        // The backend returns { message, id, messageId }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error('Error proxying create blank draft request:', error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 