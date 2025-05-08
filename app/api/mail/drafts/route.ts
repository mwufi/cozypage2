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

    let emailData;
    try {
        emailData = await request.json();
        if (!emailData.to || !emailData.subject || !emailData.body) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, body' },
                { status: 400 } // Bad Request
            );
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const response = await fetch(`${backendUrl}/gmail/drafts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
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
                { error: 'Insufficient permissions to create draft. You may need to re-grant access.' },
                { status: 403 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Gmail API - POST drafts):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error creating draft: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const data = await response.json(); // Expecting { message, id, messageId }
        return NextResponse.json(data, { status: response.status }); // Relay backend status (e.g., 201 Created)

    } catch (error) {
        console.error('Error in /api/mail/drafts Next.js route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route for creating draft' },
            { status: 500 }
        );
    }
} 