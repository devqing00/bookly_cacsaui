import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Table, Attendee } from '@/types';
import { getTableName } from '@/types';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';

const TABLES_COLLECTION = 'tables';

// Type for user lookup result
type UserLookupResult = 
  | { found: true; attendee: {
      name: string;
      email: string;
      phone?: string;
      gender?: string;
      tableNumber: number;
      tent: number;
      tableName: string;
      seatNumber: number;
      registeredAt: Date;
    }}
  | { found: false };

// Helper function to find user by email
async function findUserByEmail(email: string): Promise<UserLookupResult> {
  const tablesRef = collection(db, TABLES_COLLECTION);
  const tablesSnapshot = await getDocs(tablesRef);
  
  for (const tableDoc of tablesSnapshot.docs) {
    const tableData = tableDoc.data() as Table;
    const attendeeIndex = tableData.attendees.findIndex(
      (a: Attendee) => a.email.toLowerCase() === email.toLowerCase()
    );
    
    if (attendeeIndex !== -1) {
      const attendee = tableData.attendees[attendeeIndex];
      return {
        found: true,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          gender: attendee.gender,
          tableNumber: tableData.tableNumber,
          tent: tableData.tent,
          tableName: getTableName(tableData.tableNumber, tableData.tent),
          seatNumber: attendeeIndex + 1,
          registeredAt: attendee.registeredAt,
        },
      };
    }
  }
  
  return { found: false };
}

// Helper function to find user by phone
async function findUserByPhone(phone: string): Promise<UserLookupResult> {
  const tablesRef = collection(db, TABLES_COLLECTION);
  const tablesSnapshot = await getDocs(tablesRef);
  
  // Normalize phone for comparison (remove spaces, dashes, etc.)
  const normalizedSearchPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  for (const tableDoc of tablesSnapshot.docs) {
    const tableData = tableDoc.data() as Table;
    const attendeeIndex = tableData.attendees.findIndex(
      (a: Attendee) => {
        if (!a.phone) return false;
        const normalizedAttendeePhone = a.phone.replace(/[\s\-\(\)]/g, '');
        return normalizedAttendeePhone === normalizedSearchPhone;
      }
    );
    
    if (attendeeIndex !== -1) {
      const attendee = tableData.attendees[attendeeIndex];
      return {
        found: true,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          gender: attendee.gender,
          tableNumber: tableData.tableNumber,
          tent: tableData.tent,
          tableName: getTableName(tableData.tableNumber, tableData.tent),
          seatNumber: attendeeIndex + 1,
          registeredAt: attendee.registeredAt,
        },
      };
    }
  }
  
  return { found: false };
}

// POST - Send email to an existing user
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const result = await findUserByEmail(email);

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: 'User not found with this email address' },
        { status: 404 }
      );
    }

    const { attendee } = result;

    // Generate QR code data
    const qrData = JSON.stringify({
      name: attendee.name,
      email: attendee.email,
      table: attendee.tableNumber,
      tent: attendee.tent,
      seat: attendee.seatNumber,
      phone: attendee.phone,
      gender: attendee.gender,
      event: 'CACSAUI Love Feast',
    });

    // Send confirmation email
    const emailResult = await sendConfirmationEmail({
      to: attendee.email,
      name: attendee.name,
      tableNumber: attendee.tableNumber,
      tent: attendee.tent,
      tableName: attendee.tableName,
      seatNumber: attendee.seatNumber,
      phone: attendee.phone,
      gender: attendee.gender,
      qrData,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: emailResult.messageId,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          tableNumber: attendee.tableNumber,
          tent: attendee.tent,
          tableName: attendee.tableName,
          seatNumber: attendee.seatNumber,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Fetch user details by email or phone (without sending email)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'Email or phone parameter is required' },
        { status: 400 }
      );
    }

    // Search by phone if provided, otherwise by email
    const result = phone 
      ? await findUserByPhone(phone)
      : await findUserByEmail(email!);

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: `User not found with this ${phone ? 'phone number' : 'email address'}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attendee: result.attendee,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user details';
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
