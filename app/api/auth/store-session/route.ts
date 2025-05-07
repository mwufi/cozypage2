import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jwt } = body;

        if (!jwt) {
            return NextResponse.json({ error: 'JWT not provided' }, { status: 400 });
        }

        // Set the JWT as an HttpOnly cookie
        // Note: secure should be true in production (when using HTTPS)
        const isProduction = process.env.NODE_ENV === 'production';

        cookies().set('app_jwt', jwt, {
            httpOnly: true,
            secure: isProduction,
            path: '/', // Available to all paths
            sameSite: 'lax', // Or 'strict' depending on your needs
            maxAge: 60 * 60 * 24 * 7, // Example: 7 days, adjust as needed
        });

        return NextResponse.json({ message: 'Session token stored successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error in store-session API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 