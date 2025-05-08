import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // If using next-auth for app_jwt

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    // Option 1: If your app_jwt is a standard JWT managed by next-auth
    // const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // const appToken = token?.app_jwt; // Assuming app_jwt is nested in next-auth token

    // Option 2: If app_jwt is a simple cookie you manage directly
    const appToken = request.cookies.get('app_jwt')?.value;

    if (!appToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const labelIds = searchParams.getAll('label_ids'); // .getAll for multiple values
    const maxResults = searchParams.get('max_results');

    // Construct the target URL for the Python backend
    const targetUrl = new URL(`${PYTHON_BACKEND_URL}/gmail/messages`);

    if (labelIds && labelIds.length > 0) {
        labelIds.forEach(id => targetUrl.searchParams.append('label_ids', id));
    }
    if (maxResults) {
        targetUrl.searchParams.append('max_results', maxResults);
    }

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
                { error: data.detail || 'Error fetching mail from backend' },
                { status: backendResponse.status }
            );
        }
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error('Error proxying mail request:', error);
        return NextResponse.json({ error: 'Internal server error proxying request' }, { status: 500 });
    }
} 