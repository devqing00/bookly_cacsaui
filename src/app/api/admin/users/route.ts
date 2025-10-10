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
      tent: number;
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
          tent: tableData.tent,
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
    const { tableId, seatIndex, name, email, phone, gender, newTableNumber, newTent } = await request.json();

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

    // Handle table/tent reassignment
    if ((newTableNumber !== undefined && newTableNumber !== null) || (newTent !== undefined && newTent !== null)) {
      // Use transaction to ensure atomicity when moving between tables
      const result = await runTransaction(db, async (transaction) => {
        const oldTableRef = doc(db, TABLES_COLLECTION, tableId);
        const oldTableDoc = await transaction.get(oldTableRef);

        if (!oldTableDoc.exists()) {
          throw new Error('Source table not found');
        }

        const oldTableData = oldTableDoc.data() as Table;
        const attendee = oldTableData.attendees[seatIndex];

        if (!attendee) {
          throw new Error('Attendee not found');
        }

        // Update attendee details
        const updatedAttendee: Attendee = {
          ...attendee,
          name: sanitizedName || attendee.name,
          email: sanitizedEmail || attendee.email,
          phone: sanitizedPhone !== undefined ? sanitizedPhone : attendee.phone,
          gender: (sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say') || attendee.gender,
          tent: newTent !== undefined && newTent !== null ? newTent : attendee.tent,
        };

        const targetTent = newTent !== undefined && newTent !== null ? newTent : oldTableData.tent;
        const targetTableNumber = newTableNumber !== undefined && newTableNumber !== null ? newTableNumber : oldTableData.tableNumber;

        // Check if moving to a different table or tent
        if (targetTableNumber !== oldTableData.tableNumber || targetTent !== oldTableData.tent) {
          // Find or create the target table
          const tablesRef = collection(db, TABLES_COLLECTION);
          const allTablesSnapshot = await getDocs(tablesRef);
          
          const targetTableDoc = allTablesSnapshot.docs.find(doc => {
            const data = doc.data() as Table;
            return data.tableNumber === targetTableNumber && data.tent === targetTent;
          });

          if (targetTableDoc) {
            // Target table exists, add attendee there
            const targetTableData = targetTableDoc.data() as Table;
            
            if (targetTableData.seat_count >= targetTableData.maxCapacity) {
              throw new Error('Target table is full');
            }

            const newAttendees = [...targetTableData.attendees, updatedAttendee];
            transaction.update(targetTableDoc.ref, {
              attendees: newAttendees,
              seat_count: newAttendees.length,
            });
          } else {
            // Target table doesn't exist, create it
            const { getTableName, SEATS_PER_TABLE } = await import('@/types');
            const newTable: Omit<Table, 'table_id'> = {
              tableNumber: targetTableNumber,
              tent: targetTent,
              tableName: getTableName(targetTableNumber, targetTent),
              attendees: [updatedAttendee],
              seat_count: 1,
              maxCapacity: SEATS_PER_TABLE,
            };

            const newTableRef = doc(collection(db, TABLES_COLLECTION));
            transaction.set(newTableRef, {
              ...newTable,
              table_id: `table_${targetTableNumber}_tent_${targetTent}`,
            });
          }

          // Remove from old table
          const oldAttendees = [...oldTableData.attendees];
          oldAttendees.splice(seatIndex, 1);
          
          transaction.update(oldTableRef, {
            attendees: oldAttendees,
            seat_count: oldAttendees.length,
          });

          return {
            success: true,
            message: 'Attendee moved successfully',
            movedTo: {
              tableNumber: targetTableNumber,
              tent: targetTent,
            },
          };
        } else {
          // Same table, just update details
          const updatedAttendees = [...oldTableData.attendees];
          updatedAttendees[seatIndex] = updatedAttendee;

          transaction.update(oldTableRef, {
            attendees: updatedAttendees,
          });

          return {
            success: true,
            message: 'Attendee updated successfully',
          };
        }
      });

      return NextResponse.json(result);
    }

    // No reassignment, just update details in place
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
