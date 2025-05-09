import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Context {
    params: {
        thread_id: string; // Changed from message_id
    }
}

// Proxy for getting a specific thread detail
export async function GET(request: NextRequest, context: Context) {
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { thread_id } = context.params; // Changed from message_id

    if (!thread_id) {
        return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Construct target URL for the Python backend thread detail endpoint
    const targetUrl = `${PYTHON_BACKEND_URL}/gmail/threads/${thread_id}`;
    // Add any query params if needed (e.g., format)
    // const { searchParams } = new URL(request.url);
    // const targetUrlWithParams = new URL(targetUrl);
    // targetUrlWithParams.search = searchParams.toString();

    try {
        const backendResponse = await fetch(targetUrl /* use targetUrlWithParams if adding params */, {
            headers: {
                'Authorization': `Bearer ${appToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.detail || `Error fetching thread ${thread_id} from backend` },
                { status: backendResponse.status }
            );
        }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error(`Error proxying request for thread ${thread_id}:`, error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 