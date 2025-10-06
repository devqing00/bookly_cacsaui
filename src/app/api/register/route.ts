import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  runTransaction,
  orderBy,
  where,
} from 'firebase/firestore';
import type { Table, Attendee } from '@/types';

const MAX_SEATS_PER_TABLE = 6;
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

// Helper function to check if email exists in any table
async function checkExistingRegistration(email: string) {
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
        exists: true,
        tableNumber: tableData.tableNumber,
        seatNumber: attendeeIndex + 1,
        name: attendee.name,
        phone: attendee.phone,
        gender: attendee.gender,
        registeredAt: attendee.registeredAt,
      };
    }
  }
  
  return { exists: false };
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, gender, checkOnly } = await request.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = phone ? sanitizeInput(phone) : '';
    const sanitizedGender = gender || '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateName(sanitizedName);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error },
        { status: 400 }
      );
    }

    // Check for existing registration
    const existingReg = await checkExistingRegistration(sanitizedEmail);
    
    // If checkOnly flag is set, just return existence status
    if (checkOnly) {
      if (existingReg.exists) {
        return NextResponse.json({
          exists: true,
          registration: {
            name: existingReg.name,
            email: sanitizedEmail,
            phone: existingReg.phone,
            gender: existingReg.gender,
            tableNumber: existingReg.tableNumber,
            seatNumber: existingReg.seatNumber,
            registeredAt: existingReg.registeredAt,
          },
        });
      }
      return NextResponse.json({ exists: false });
    }

    // If already registered, return their existing assignment
    if (existingReg.exists) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        tableNumber: existingReg.tableNumber,
        seatNumber: existingReg.seatNumber,
        name: existingReg.name,
        phone: existingReg.phone,
        gender: existingReg.gender,
        error: 'You are already registered for this event',
      });
    }

    // Use a transaction to ensure atomicity with retry logic
    let retries = 3;
    let result;
    
    while (retries > 0) {
      try {
        result = await runTransaction(db, async (transaction) => {
          const tablesRef = collection(db, TABLES_COLLECTION);
          
          let querySnapshot;
          
          try {
            // Try to query for tables with available seats (requires composite index)
            const q = query(
              tablesRef,
              where('seat_count', '<', MAX_SEATS_PER_TABLE),
              orderBy('seat_count', 'asc'),
              orderBy('tableNumber', 'asc')
            );
            querySnapshot = await getDocs(q);
          } catch (indexError: any) {
            // Fallback: If index doesn't exist yet, get all tables and filter manually
            if (indexError.code === 'failed-precondition') {
              console.log('Index not ready, using fallback query...');
              const allTablesQuery = query(tablesRef, orderBy('tableNumber', 'asc'));
              const allTables = await getDocs(allTablesQuery);
              
              // Filter manually for tables with available seats
              const availableTables = allTables.docs.filter(
                doc => (doc.data() as Table).seat_count < MAX_SEATS_PER_TABLE
              );
              
              // Create a mock QuerySnapshot with filtered docs
              querySnapshot = {
                docs: availableTables,
                empty: availableTables.length === 0
              } as any;
            } else {
              throw indexError;
            }
          }
          
          const newAttendee: Attendee = {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            gender: sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
            registeredAt: new Date(),
          };

          let assignedTableNumber: number;
          let seatNumber: number;

          if (!querySnapshot.empty) {
            // Found a table with available seats
            const firstAvailableTable = querySnapshot.docs[0];
            const tableData = firstAvailableTable.data() as Table;
            const tableRef = doc(db, TABLES_COLLECTION, firstAvailableTable.id);

            const updatedAttendees = [...tableData.attendees, newAttendee];
            const updatedSeatCount = updatedAttendees.length;

            transaction.update(tableRef, {
              attendees: updatedAttendees,
              seat_count: updatedSeatCount,
            });

            assignedTableNumber = tableData.tableNumber;
            seatNumber = updatedSeatCount;
          } else {
            // No available tables, create a new one
            // First, get the highest table number
            const allTablesQuery = query(tablesRef, orderBy('tableNumber', 'desc'));
            const allTablesSnapshot = await getDocs(allTablesQuery);
            
            const newTableNumber = allTablesSnapshot.empty
              ? 1
              : (allTablesSnapshot.docs[0].data() as Table).tableNumber + 1;

            const newTable: Omit<Table, 'table_id'> = {
              tableNumber: newTableNumber,
              attendees: [newAttendee],
              seat_count: 1,
              maxCapacity: MAX_SEATS_PER_TABLE,
            };

            // Add new table
            const newTableRef = await addDoc(tablesRef, {
              ...newTable,
              table_id: `table_${newTableNumber}`,
            });

            assignedTableNumber = newTableNumber;
            seatNumber = 1;
          }

          return {
            success: true,
            tableNumber: assignedTableNumber,
            seatNumber,
            name: sanitizedName,
            phone: sanitizedPhone,
            gender: sanitizedGender,
          };
        });

        // Check capacity warnings after successful registration
        if (result.success) {
          const tableRef = doc(db, TABLES_COLLECTION, `table_${result.tableNumber}`);
          const tableSnapshot = await getDoc(tableRef);
          
          if (tableSnapshot.exists()) {
            const tableData = tableSnapshot.data() as Table;
            const capacityPercent = (tableData.seat_count / tableData.maxCapacity) * 100;
            
            // Add capacity warning to response
            if (capacityPercent >= 100) {
              (result as any).capacityWarning = {
                level: 'full',
                message: `Table ${result.tableNumber} is now FULL (${tableData.seat_count}/${tableData.maxCapacity} seats)`,
                percent: 100
              };
            } else if (capacityPercent >= 80) {
              (result as any).capacityWarning = {
                level: 'warning',
                message: `Table ${result.tableNumber} is ${capacityPercent.toFixed(0)}% full (${tableData.seat_count}/${tableData.maxCapacity} seats)`,
                percent: capacityPercent
              };
            }
          }
        }
        
        break; // Success, exit retry loop
      } catch (error: any) {
        retries--;
        if (retries === 0) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to register. Please try again.',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check registration or view all tables
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // If email parameter is provided, check registration
    if (email) {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const existingReg = await checkExistingRegistration(sanitizedEmail);
      
      if (existingReg.exists) {
        return NextResponse.json({
          exists: true,
          registration: {
            name: existingReg.name,
            email: sanitizedEmail,
            phone: existingReg.phone,
            gender: existingReg.gender,
            tableNumber: existingReg.tableNumber,
            seatNumber: existingReg.seatNumber,
            registeredAt: existingReg.registeredAt,
          },
        });
      }
      
      return NextResponse.json({ exists: false });
    }
    
    // Otherwise, return all tables
    const tablesRef = collection(db, TABLES_COLLECTION);
    const q = query(tablesRef, orderBy('tableNumber', 'asc'));
    const querySnapshot = await getDocs(q);

    const tables = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
