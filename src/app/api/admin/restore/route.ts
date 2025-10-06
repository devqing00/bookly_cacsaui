import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import type { Table } from '@/types';

const TABLES_COLLECTION = 'tables';

// POST - Restore deleted user
export async function POST(request: Request) {
  try {
    const { tableId, seatIndex } = await request.json();

    if (!tableId || seatIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Table ID and seat index are required' },
        { status: 400 }
      );
    }

    const result = await runTransaction(db, async (transaction) => {
      const tableRef = doc(db, TABLES_COLLECTION, tableId);
      const tableDoc = await transaction.get(tableRef);

      if (!tableDoc.exists()) {
        throw new Error('Table not found');
      }

      const tableData = tableDoc.data() as Table;
      const updatedAttendees = [...tableData.attendees];

      if (!updatedAttendees[seatIndex]) {
        throw new Error('Attendee not found');
      }

      if (!updatedAttendees[seatIndex].deleted) {
        throw new Error('Attendee is not deleted');
      }

      // Restore the attendee
      delete updatedAttendees[seatIndex].deleted;
      delete updatedAttendees[seatIndex].deletedAt;

      const activeCount = tableData.attendees.filter(a => !a.deleted).length + 1;

      transaction.update(tableRef, {
        attendees: updatedAttendees,
        seat_count: activeCount,
      });

      return {
        success: true,
        message: 'Attendee restored successfully',
        restoredAttendee: updatedAttendees[seatIndex],
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error restoring attendee:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore attendee' },
      { status: 500 }
    );
  }
}
