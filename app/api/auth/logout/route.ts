import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('app_jwt');

        if (!token) {
            // No token, so user is effectively already logged out from our app's perspective
            return NextResponse.json({ message: 'No active session to logout from' }, { status: 200 });
        }

        // Clear the JWT cookie by setting its maxAge to 0 or -1
        cookieStore.set('app_jwt', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: -1 // Tell the browser to expire/delete the cookie immediately
        });

        // Optionally, you could redirect to the login page or home page
        // For an API route, returning a JSON response is common.
        // const siteUrl = new URL(request.url);
        // return NextResponse.redirect(`${siteUrl.origin}/login`); 

        return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed due to an internal error' }, { status: 500 });
    }
} 