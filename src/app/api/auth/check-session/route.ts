import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Check if the current user has a valid admin session
 * Returns authentication status
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'No valid session found' 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      authenticated: true,
      message: 'Valid session' 
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to verify session' 
      },
      { status: 500 }
    );
  }
}
