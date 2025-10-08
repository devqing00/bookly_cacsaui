import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the attendee by email
    const tablesRef = collection(db, 'tables');
    const tablesSnapshot = await getDocs(tablesRef);

    let foundAttendee = null;
    let tableId = null;
    let attendeeIndex = -1;

    for (const tableDoc of tablesSnapshot.docs) {
      const tableData = tableDoc.data();
      const attendees = tableData.attendees || [];

      const index = attendees.findIndex(
        (a: { email: string }) => a.email.toLowerCase() === email.toLowerCase()
      );

      if (index !== -1) {
        foundAttendee = attendees[index];
        tableId = tableDoc.id;
        attendeeIndex = index;
        break;
      }
    }

    if (!foundAttendee) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (foundAttendee.checkedIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already checked in',
          alreadyCheckedIn: true,
          checkedInAt: foundAttendee.checkedInAt,
          attendee: {
            name: foundAttendee.name,
            email: foundAttendee.email,
            phone: foundAttendee.phone,
            gender: foundAttendee.gender,
          },
        },
        { status: 400 }
      );
    }

    // Update check-in status
    const tableRef = doc(db, 'tables', tableId!);
    const currentTable = tablesSnapshot.docs.find(d => d.id === tableId)?.data();

    if (!currentTable) {
      return NextResponse.json(
        { success: false, error: 'Table data not found' },
        { status: 500 }
      );
    }

    const updatedAttendees = [...currentTable.attendees];
    updatedAttendees[attendeeIndex] = {
      ...updatedAttendees[attendeeIndex],
      checkedIn: true,
      checkedInAt: Timestamp.now(),
    };

    await updateDoc(tableRef, {
      attendees: updatedAttendees,
    });

    // Log the check-in activity
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/activity-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-in',
          attendeeName: foundAttendee.name,
          attendeeEmail: foundAttendee.email,
          tableNumber: currentTable.tableNumber,
          seatNumber: attendeeIndex + 1,
          details: 'Checked in at Love Feast',
          systemAction: true, // Mark as system action to bypass admin auth
        }),
      });
    } catch (logError) {
      console.error('Failed to log check-in activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      name: foundAttendee.name,
      email: foundAttendee.email,
      phone: foundAttendee.phone,
      gender: foundAttendee.gender,
      tableNumber: currentTable.tableNumber,
      tableName: currentTable.tableName,
      seatNumber: attendeeIndex + 1,
      checkedInAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check in. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve check-in status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the attendee by email
    const tablesRef = collection(db, 'tables');
    const tablesSnapshot = await getDocs(tablesRef);

    let foundAttendee = null;
    let tableData = null;
    let seatNumber = -1;

    for (const tableDoc of tablesSnapshot.docs) {
      const table = tableDoc.data();
      const attendees = table.attendees || [];

      const index = attendees.findIndex(
        (a: { email: string }) => a.email.toLowerCase() === email.toLowerCase()
      );

      if (index !== -1) {
        foundAttendee = attendees[index];
        tableData = table;
        seatNumber = index + 1;
        break;
      }
    }

    if (!foundAttendee) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      checkedIn: foundAttendee.checkedIn || false,
      checkedInAt: foundAttendee.checkedInAt,
      attendee: {
        name: foundAttendee.name,
        email: foundAttendee.email,
        phone: foundAttendee.phone,
        gender: foundAttendee.gender,
        tableNumber: tableData?.tableNumber || 0,
        tableName: tableData?.tableName,
        seatNumber,
      },
    });
  } catch (error) {
    console.error('Check-in status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve check-in status' },
      { status: 500 }
    );
  }
}
