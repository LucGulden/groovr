import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/session
 * Creates a session cookie from a Firebase ID token
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Set the session cookie
    const cookieStore = await cookies();

    // Set cookie with secure options
    // Session expires in 5 days (same as Firebase default)
    const maxAge = 60 * 60 * 24 * 5; // 5 days in seconds

    cookieStore.set('token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        uid: decodedToken.uid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
