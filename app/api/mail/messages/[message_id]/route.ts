import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

interface Context {
    params: {
        message_id: string;
    }
}

export async function GET(request: NextRequest, context: Context) {
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { message_id } = context.params;

    if (!message_id) {
        return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const targetUrl = `${PYTHON_BACKEND_URL}/gmail/messages/${message_id}`;
    // Add any other query params if needed, e.g., format=full (though backend defaults to full)
    // const targetUrl = `${PYTHON_BACKEND_URL}/gmail/messages/${message_id}?format=full`;

    try {
        const backendResponse = await fetch(targetUrl, {
            headers: {
                'Authorization': `Bearer ${appToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.detail || `Error fetching message ${message_id} from backend` },
                { status: backendResponse.status }
            );
        }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error(`Error proxying request for message ${message_id}:`, error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 