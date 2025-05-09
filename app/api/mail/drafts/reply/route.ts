import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { original_message_id } = requestBody;

    if (!original_message_id) {
        return NextResponse.json({ error: 'original_message_id is required' }, { status: 400 });
    }

    const targetUrl = `${PYTHON_BACKEND_URL}/gmail/drafts/reply`;

    try {
        const backendResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ original_message_id }),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.detail || 'Error creating reply draft via backend' },
                { status: backendResponse.status }
            );
        }
        // The backend returns { message, id, messageId, threadId }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error('Error proxying create reply draft request:', error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 