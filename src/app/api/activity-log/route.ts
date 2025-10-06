import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import type { ActivityLog } from '@/types';

const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

/**
 * Check if the request has a valid admin session
 */
async function checkAuthentication(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

// POST - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, attendeeName, attendeeEmail, tableNumber, seatNumber, details, systemAction } = body;

    // Check authentication for admin actions, but allow system actions (like check-in)
    if (!systemAction) {
      if (!(await checkAuthentication())) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin login required' },
          { status: 401 }
        );
      }
    }

    if (!action || !attendeeName || !attendeeEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const activityLog = {
      action,
      performedBy: systemAction ? 'system' : 'admin',
      targetUser: attendeeEmail || '',
      attendeeName,
      attendeeEmail,
      tableNumber,
      seatNumber,
      details: details || '',
      timestamp: Timestamp.now(),
    };

    const logsRef = collection(db, ACTIVITY_LOGS_COLLECTION);
    await addDoc(logsRef, activityLog);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}

// GET - Retrieve activity logs
export async function GET(request: NextRequest) {
  // Check authentication
  if (!(await checkAuthentication())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Admin login required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const actionFilter = searchParams.get('action');
    
    const logsRef = collection(db, ACTIVITY_LOGS_COLLECTION);
    let q;

    if (actionFilter && actionFilter !== 'all') {
      q = query(
        logsRef,
        where('action', '==', actionFilter),
        orderBy('timestamp', 'desc'),
        limit(parseInt(limitParam || '50'))
      );
    } else {
      q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(parseInt(limitParam || '50'))
      );
    }

    const querySnapshot = await getDocs(q);
    const logs: ActivityLog[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString(),
    } as ActivityLog));

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
