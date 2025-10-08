import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  doc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import type { Table, Attendee } from '@/types';

const TABLES_COLLECTION = 'tables';

// Helper function to sanitize input
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Helper function to validate name
function validateName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(name);
  if (!sanitized) {
    return { valid: false, error: 'Name is required' };
  }
  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (sanitized.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { valid: true };
}

// GET - List all attendees
export async function GET() {
  try {
    const tablesRef = collection(db, TABLES_COLLECTION);
    const q = query(tablesRef, orderBy('tableNumber', 'asc'));
    const querySnapshot = await getDocs(q);

    const allAttendees: Array<{
      tableId: string;
      tableNumber: number;
      seatNumber: number;
      name: string;
      email: string;
      phone?: string;
      gender?: string;
      checkedIn?: boolean;
      checkedInAt?: string;
    }> = [];

    querySnapshot.forEach((doc) => {
      const tableData = doc.data() as Table;
      tableData.attendees.forEach((attendee, index) => {
        allAttendees.push({
          tableId: doc.id,
          tableNumber: tableData.tableNumber,
          seatNumber: index + 1,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          gender: attendee.gender,
          checkedIn: attendee.checkedIn,
          checkedInAt: attendee.checkedInAt?.toString(),
        });
      });
    });

    return NextResponse.json({ attendees: allAttendees });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendees';
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Edit user details
export async function PUT(request: Request) {
  try {
    const { tableId, seatIndex, name, email, phone, gender } = await request.json();

    // Validate required fields
    if (!tableId || seatIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Table ID and seat index are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name ? sanitizeInput(name) : undefined;
    const sanitizedEmail = email ? sanitizeInput(email).toLowerCase() : undefined;
    const sanitizedPhone = phone ? sanitizeInput(phone) : undefined;
    const sanitizedGender = gender || undefined;

    // Validate name if provided
    if (sanitizedName) {
      const nameValidation = validateName(sanitizedName);
      if (!nameValidation.valid) {
        return NextResponse.json(
          { success: false, error: nameValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate email if provided
    if (sanitizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email already exists (excluding current user)
      const tablesRef = collection(db, TABLES_COLLECTION);
      const tablesSnapshot = await getDocs(tablesRef);
      
      for (const tableDoc of tablesSnapshot.docs) {
        const tableData = tableDoc.data() as Table;
        const existingIndex = tableData.attendees.findIndex(
          (a: Attendee, idx: number) => 
            a.email.toLowerCase() === sanitizedEmail && 
            !(tableDoc.id === tableId && idx === seatIndex)
        );
        
        if (existingIndex !== -1) {
          return NextResponse.json(
            { success: false, error: 'Email already registered to another attendee' },
            { status: 400 }
          );
        }
      }
    }

    // Update the attendee
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    const tableSnapshot = await getDoc(tableRef);

    if (!tableSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    const tableData = tableSnapshot.data() as Table;
    const updatedAttendees = [...tableData.attendees];

    if (!updatedAttendees[seatIndex]) {
      return NextResponse.json(
        { success: false, error: 'Attendee not found' },
        { status: 404 }
      );
    }

    // Update only provided fields
    if (sanitizedName) updatedAttendees[seatIndex].name = sanitizedName;
    if (sanitizedEmail) updatedAttendees[seatIndex].email = sanitizedEmail;
    if (sanitizedPhone !== undefined) updatedAttendees[seatIndex].phone = sanitizedPhone;
    if (sanitizedGender) updatedAttendees[seatIndex].gender = sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say';

    await updateDoc(tableRef, {
      attendees: updatedAttendees,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendee updated successfully',
      attendee: updatedAttendees[seatIndex],
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update attendee';
    console.error('Error updating attendee:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const seatIndex = searchParams.get('seatIndex');

    console.log('DELETE request - tableId:', tableId, 'seatIndex:', seatIndex);

    if (!tableId || !seatIndex) {
      return NextResponse.json(
        { success: false, error: 'Table ID and seat index are required' },
        { status: 400 }
      );
    }

    const seatIdx = parseInt(seatIndex);

    // Permanently delete: Remove the attendee from the array
    const result = await runTransaction(db, async (transaction) => {
      const tableRef = doc(db, TABLES_COLLECTION, tableId);
      console.log('Attempting to get table with ID:', tableId, 'from collection:', TABLES_COLLECTION);
      
      const tableDoc = await transaction.get(tableRef);
      console.log('Table document exists:', tableDoc.exists());

      if (!tableDoc.exists()) {
        throw new Error(`Table not found with ID: ${tableId}`);
      }

      const tableData = tableDoc.data() as Table;
      const updatedAttendees = [...tableData.attendees];

      if (!updatedAttendees[seatIdx]) {
        throw new Error('Attendee not found');
      }

      // Store deleted attendee info before removing
      const deletedAttendee = updatedAttendees[seatIdx];

      // Permanently remove the attendee from the array
      updatedAttendees.splice(seatIdx, 1);

      transaction.update(tableRef, {
        attendees: updatedAttendees,
        seat_count: updatedAttendees.length,
      });

      return {
        success: true,
        message: 'Attendee permanently deleted',
        deletedAttendee,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete attendee';
    console.error('Error deleting attendee:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
