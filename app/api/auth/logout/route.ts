import { NextRequest, NextResponse } from 'next/server';
// No need to import cookies for reading if we just clear it

export async function GET(request: NextRequest) {
    try {
        // We don't need to check if the cookie exists first.
        // Just sending the clearing header is sufficient.

        // Create a response
        const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

        // Set the cookie-clearing header on the response
        response.cookies.set('app_jwt', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: -1 // Instructs browser to delete the cookie
        });

        // Optional: Redirect after logout
        // const siteUrl = new URL(request.url);
        // response.headers.set('Location', `${siteUrl.origin}/login`); // Set redirect header
        // return new Response(null, { status: 302, headers: response.headers }); // Return redirect status

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        // Avoid sending sensitive error details to the client
        return NextResponse.json({ error: 'Logout failed due to an internal server error' }, { status: 500 });
    }
} 