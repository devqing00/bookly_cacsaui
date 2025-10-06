import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Check if the request has a valid admin session
 */
async function checkAuthentication(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

/**
 * DELETE - Reset all data (delete all tables and activity logs)
 * This is a dangerous operation that requires admin authentication
 */
export async function DELETE(request: NextRequest) {
  // Check authentication
  if (!(await checkAuthentication())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Admin login required' },
      { status: 401 }
    );
  }

  try {
    let deletedTables = 0;
    let deletedLogs = 0;

    // Delete all tables
    const tablesRef = collection(db, 'tables');
    const tablesSnapshot = await getDocs(tablesRef);
    
    const tableDeletePromises = tablesSnapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, 'tables', docSnapshot.id));
      deletedTables++;
    });

    await Promise.all(tableDeletePromises);

    // Delete all activity logs
    const logsRef = collection(db, 'activity_logs');
    const logsSnapshot = await getDocs(logsRef);
    
    const logDeletePromises = logsSnapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, 'activity_logs', docSnapshot.id));
      deletedLogs++;
    });

    await Promise.all(logDeletePromises);

    return NextResponse.json({
      success: true,
      message: 'All data has been reset successfully',
      deleted: {
        tables: deletedTables,
        activityLogs: deletedLogs,
      },
    });
  } catch (error: any) {
    console.error('Error resetting data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset data' },
      { status: 500 }
    );
  }
}
