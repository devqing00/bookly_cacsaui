import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  getDoc,
  addDoc,
  doc,
  runTransaction,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import type { Table, Attendee } from '@/types';
import { TOTAL_TENTS, TABLES_PER_TENT, SEATS_PER_TABLE, getTableName } from '@/types';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';

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
        tent: tableData.tent,
        tableName: getTableName(tableData.tableNumber, tableData.tent),
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

// Helper function to calculate gender balance score for a table
// Lower score = better balance, higher score = more imbalanced
function calculateGenderBalanceScore(attendees: Attendee[], newGender: string): number {
  const genderCounts: Record<string, number> = {
    Male: 0,
    Female: 0,
    Other: 0,
    'Prefer not to say': 0,
  };

  // Count existing genders
  attendees.forEach(attendee => {
    if (attendee.gender in genderCounts) {
      genderCounts[attendee.gender]++;
    }
  });

  // Add the new attendee
  if (newGender in genderCounts) {
    genderCounts[newGender]++;
  }

  // Calculate variance (measure of imbalance)
  const counts = Object.values(genderCounts);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const average = total / counts.length;
  
  const variance = counts.reduce((sum, count) => {
    return sum + Math.pow(count - average, 2);
  }, 0) / counts.length;

  return variance;
}

// Helper function to find the best table for gender balance
function findBestTableForGenderBalance(
  availableTables: Array<{ doc: QueryDocumentSnapshot<DocumentData>; data: Table }>,
  gender: string
): { doc: QueryDocumentSnapshot<DocumentData>; data: Table } | null {
  if (availableTables.length === 0) return null;

  // Calculate balance scores for each table
  const tablesWithScores = availableTables.map(table => ({
    table,
    score: calculateGenderBalanceScore(table.data.attendees, gender),
  }));

  // Sort by score (lower is better) and return the best one
  tablesWithScores.sort((a, b) => a.score - b.score);
  
  return tablesWithScores[0].table;
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
            tent: existingReg.tent,
            tableName: existingReg.tableName,
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
        tent: existingReg.tent,
        tableName: existingReg.tableName,
        seatNumber: existingReg.seatNumber,
        name: existingReg.name,
        email: sanitizedEmail,
        phone: existingReg.phone,
        gender: existingReg.gender,
        error: 'You are already registered for the Love Feast',
      });
    }

    // Use a transaction to ensure atomicity with retry logic
    let retries = 3;
    let result;
    
    while (retries > 0) {
      try {
        result = await runTransaction(db, async (transaction) => {
          const tablesRef = collection(db, TABLES_COLLECTION);
          
          // Get all tables
          const allTablesQuery = query(tablesRef);
          const allTablesSnapshot = await getDocs(allTablesQuery);
          
          // GENDER-BALANCED ASSIGNMENT: Randomly select tent first
          const assignedTent = Math.floor(Math.random() * TOTAL_TENTS) + 1; // 1, 2, or 3
          
          // Filter tables for the selected tent with available seats
          const tentTables = allTablesSnapshot.docs
            .map(doc => ({ doc, data: doc.data() as Table }))
            .filter(({ data }) => data.tent === assignedTent && data.seat_count < SEATS_PER_TABLE);
          
          let assignedTableNumber!: number;
          let assignedTableName!: string;
          let assignedSeat!: number;
          let selectedTableDoc: QueryDocumentSnapshot<DocumentData> | null = null;

          if (tentTables.length > 0) {
            // Find the best table for gender balance in this tent
            const bestTable = findBestTableForGenderBalance(tentTables, sanitizedGender);
            
            if (bestTable) {
              selectedTableDoc = bestTable.doc;
              const tableData = bestTable.data;

              assignedTableNumber = tableData.tableNumber;
              assignedTableName = getTableName(tableData.tableNumber, assignedTent);
              assignedSeat = tableData.seat_count + 1;

              // Add attendee to existing table
              const newAttendee: Attendee = {
                name: sanitizedName,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                gender: sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
                tent: assignedTent,
                registeredAt: new Date(),
              };

              const updatedAttendees = [...tableData.attendees, newAttendee];
              
              transaction.update(selectedTableDoc.ref, {
                attendees: updatedAttendees,
                seat_count: updatedAttendees.length,
              });
            }
          } else {
            // No available tables in this tent, create a new one
            // Find which base table numbers (1-9) are already used in this tent
            const usedBaseTableNumbers = new Set<number>();
            allTablesSnapshot.docs.forEach(doc => {
              const data = doc.data() as Table;
              if (data.tent === assignedTent) {
                usedBaseTableNumbers.add(data.tableNumber);
              }
            });
            
            // Check if tent is full
            if (usedBaseTableNumbers.size >= TABLES_PER_TENT) {
              // This tent is full, try to assign to any other available table in any tent
              const anyAvailableTables = allTablesSnapshot.docs
                .map(doc => ({ doc, data: doc.data() as Table }))
                .filter(({ data }) => data.seat_count < SEATS_PER_TABLE);
              
              if (anyAvailableTables.length > 0) {
                // Use gender balancing to select from any available table
                const bestTable = findBestTableForGenderBalance(anyAvailableTables, sanitizedGender);
                
                if (bestTable) {
                  selectedTableDoc = bestTable.doc;
                  const tableData = bestTable.data;
                  
                  const actualTent = tableData.tent;
                  assignedTableNumber = tableData.tableNumber;
                  assignedTableName = getTableName(tableData.tableNumber, actualTent);
                  assignedSeat = tableData.seat_count + 1;

                  const newAttendee: Attendee = {
                    name: sanitizedName,
                    email: sanitizedEmail,
                    phone: sanitizedPhone,
                    gender: sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
                    tent: actualTent,
                    registeredAt: new Date(),
                  };

                  const updatedAttendees = [...tableData.attendees, newAttendee];
                  
                  transaction.update(selectedTableDoc.ref, {
                    attendees: updatedAttendees,
                    seat_count: updatedAttendees.length,
                  });
                } else {
                  throw new Error('Unable to find suitable table.');
                }
              } else {
                throw new Error('All tables are full. Maximum capacity reached.');
              }
            } else {
              // Create new table in this tent
              // Find available base table numbers for this tent
              const availableBaseTableNumbers: number[] = [];
              for (let i = 1; i <= TABLES_PER_TENT; i++) {
                if (!usedBaseTableNumbers.has(i)) {
                  availableBaseTableNumbers.push(i);
                }
              }
              
              // Randomly select a base table number
              const randomIndex = Math.floor(Math.random() * availableBaseTableNumbers.length);
              const newBaseTableNumber = availableBaseTableNumbers[randomIndex];
              
              assignedTableNumber = newBaseTableNumber;
              assignedTableName = getTableName(newBaseTableNumber, assignedTent);
              assignedSeat = 1;

              const newAttendee: Attendee = {
                name: sanitizedName,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                gender: sanitizedGender as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
                tent: assignedTent,
                registeredAt: new Date(),
              };

              const newTable: Omit<Table, 'table_id'> = {
                tableNumber: newBaseTableNumber,
                tent: assignedTent,
                tableName: assignedTableName,
                attendees: [newAttendee],
                seat_count: 1,
                maxCapacity: SEATS_PER_TABLE,
              };

              await addDoc(tablesRef, {
                ...newTable,
                table_id: `table_${newBaseTableNumber}_tent_${assignedTent}`,
              });
            }
          }

          return {
            success: true,
            tableNumber: assignedTableNumber,
            tent: assignedTent,
            tableName: assignedTableName,
            seatNumber: assignedSeat,
            name: sanitizedName,
            email: sanitizedEmail,
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
              (result as { success: boolean; tableNumber: number; seatNumber: number; name: string; phone: string; gender: string; capacityWarning?: { level: string; message: string; percent: number } }).capacityWarning = {
                level: 'full',
                message: `Table ${result.tableNumber} is now FULL (${tableData.seat_count}/${tableData.maxCapacity} seats)`,
                percent: 100
              };
            } else if (capacityPercent >= 80) {
              (result as { success: boolean; tableNumber: number; seatNumber: number; name: string; phone: string; gender: string; capacityWarning?: { level: string; message: string; percent: number } }).capacityWarning = {
                level: 'warning',
                message: `Table ${result.tableNumber} is ${capacityPercent.toFixed(0)}% full (${tableData.seat_count}/${tableData.maxCapacity} seats)`,
                percent: capacityPercent
              };
            }
          }
        }
        
        break; // Success, exit retry loop
      } catch (error: unknown) {
        retries--;
        if (retries === 0) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Send confirmation email after successful registration
    if (result?.success) {
      const qrData = JSON.stringify({
        name: result.name,
        email: sanitizedEmail,
        table: result.tableNumber,
        tent: result.tent,
        seat: result.seatNumber,
        phone: result.phone,
        gender: result.gender,
        event: 'CACSAUI Love Feast',
      });

      console.log('Sending confirmation email to:', sanitizedEmail);

      try {
        // Call the email utility function directly (no HTTP request needed!)
        const emailPromise = sendConfirmationEmail({
          to: sanitizedEmail,
          name: result.name,
          tableNumber: result.tableNumber,
          tent: result.tent,
          tableName: result.tableName,
          seatNumber: result.seatNumber,
          phone: result.phone,
          gender: result.gender,
          qrData,
        });

        // Create timeout promise (10 seconds max)
        const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 10000)
        );

        // Race between email sending and timeout
        const emailResult = await Promise.race([emailPromise, timeoutPromise]);
        
        if (emailResult.success) {
          console.log('Email sent successfully:', emailResult.messageId);
        } else {
          console.error('Email sending failed:', emailResult.error);
        }
      } catch (emailError) {
        // Log email error but don't fail the registration
        console.error('Failed to send confirmation email:', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          to: sanitizedEmail,
        });
        // Still continue with successful registration response
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to register. Please try again.';
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
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
            tent: existingReg.tent,
            tableName: existingReg.tableName,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
