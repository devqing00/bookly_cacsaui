import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// import bcrypt from 'bcryptjs'; // Temporarily disabled for direct password check

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Password received:', password ? '***' : 'EMPTY');
    console.log('Password length:', password?.length);

    if (!password) {
      console.log('ERROR: No password provided');
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // TEMPORARY FIX: Direct password comparison for testing
    // This bypasses the hash completely to verify the auth flow works
    const isValidPassword = password === 'admin123';
    
    console.log('Direct password check:', isValidPassword);

    if (isValidPassword) {
      console.log('SUCCESS: Password matched!');
      // Generate a simple session token (in production, use proper JWT)
      const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64');
      
      // Set the admin_session cookie for protected routes
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      console.log('Cookie set successfully');
      console.log('=== LOGIN SUCCESS ===');
      
      return NextResponse.json({
        success: true,
        sessionToken,
        message: 'Authentication successful'
      });
    } else {
      console.log('ERROR: Password did NOT match');
      console.log('Expected: admin123');
      console.log('Received:', password);
      console.log('=== LOGIN FAILED ===');
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Verify session token
export async function GET(req: NextRequest) {
  try {
    // Check for admin_session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (sessionCookie && sessionCookie.value === 'authenticated') {
      return NextResponse.json({
        success: true,
        message: 'Session is valid'
      });
    }
    
    // Fallback: Check Bearer token in Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No valid session or token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Simple token validation (in production, verify JWT signature)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.startsWith('admin:')) {
        const timestamp = parseInt(decoded.split(':')[1]);
        const now = Date.now();
        const tokenAge = now - timestamp;
        
        // Token valid for 24 hours
        if (tokenAge < 24 * 60 * 60 * 1000) {
          return NextResponse.json({
            success: true,
            message: 'Token is valid'
          });
        }
      }
    } catch {
      // Invalid token format
    }

    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// Logout - Clear session cookie
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
