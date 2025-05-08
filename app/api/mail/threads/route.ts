import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Proxy for listing threads
export async function GET(request: NextRequest) {
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward all query parameters from the original request
    const { searchParams } = new URL(request.url);
    const targetUrl = new URL(`${PYTHON_BACKEND_URL}/gmail/threads`);
    targetUrl.search = searchParams.toString(); // Append original query params

    try {
        const backendResponse = await fetch(targetUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${appToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.detail || 'Error fetching threads from backend' },
                { status: backendResponse.status }
            );
        }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error('Error proxying list threads request:', error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 