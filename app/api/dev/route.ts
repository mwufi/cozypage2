import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    //   // Only allow in development mode
    //   if (process.env.NODE_ENV === 'production') {
    //     return NextResponse.json(
    //       { error: 'This endpoint is only available in development mode' },
    //       { status: 403 }
    //     );
    //   }

    // Collect environment variables
    const envVars = {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
        PROD_BACKEND_URL: process.env.PROD_BACKEND_URL || 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set',
    };

    return NextResponse.json(
        {
            message: 'Development environment variables',
            environment: envVars
        },
        { status: 200 }
    );
}
