import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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
        const response = await fetch(`${backendUrl}/calendar/events_week`, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
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
                { error: 'Insufficient permissions for Calendar on the backend.' },
                { status: 403 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Calendar API - GET events_week):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error fetching calendar events: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            const textData = await response.text();
            console.error('Received unexpected non-JSON response from backend (Calendar API - GET events_week):', response.status, textData.substring(0, 500));
            return NextResponse.json(
                { error: 'Received unexpected non-JSON response from backend' },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error('Error in /api/calendar/events Next.js route (GET):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route for calendar events' },
            { status: 500 }
        );
    }
}

// POST function for creating a calendar event
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

    let eventData;
    try {
        eventData = await request.json();
        // Basic validation, more thorough validation happens on the backend
        if (!eventData.summary || !eventData.start || !eventData.end) {
            return NextResponse.json(
                { error: 'Missing required fields: summary, start, end' },
                { status: 400 } // Bad Request
            );
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const response = await fetch(`${backendUrl}/calendar/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
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
                { error: 'Insufficient permissions to create event. You may need to re-grant access.' },
                { status: 403 }
            );
        }
        if (response.status === 400) { // Catch bad requests from backend validation
            const data = await response.json();
            return NextResponse.json(
                { error: data.detail || 'Invalid event data provided.' },
                { status: 400 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Python backend (Calendar API - POST events):', response.status, errorText.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error creating event: ${response.status} - ${errorText.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const data = await response.json(); // Expecting { message, id, summary, htmlLink }
        return NextResponse.json(data, { status: response.status }); // Relay backend status (e.g., 201 Created)

    } catch (error) {
        console.error('Error in /api/calendar/events Next.js route (POST):', error);
        return NextResponse.json(
            { error: 'Internal Server Error in Next.js API route for creating calendar event' },
            { status: 500 }
        );
    }
} 