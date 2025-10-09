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
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import type { Table, Attendee } from '@/types';
import { TOTAL_TABLES, SEATS_PER_TABLE, TABLE_NAMES } from '@/types';

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
        tableName: TABLE_NAMES[tableData.tableNumber],
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

// Helper function to count gender distribution in a table
function getGenderCounts(attendees: Attendee[]) {
  const counts = { Male: 0, Female: 0, Other: 0 };
  attendees.forEach((a) => {
    if (a.gender === 'Male') counts.Male++;
    else if (a.gender === 'Female') counts.Female++;
    else counts.Other++;
  });
  return counts;
}

// Helper function to calculate gender balance score (lower is better)
function calculateGenderBalanceScore(attendees: Attendee[], newGender: string) {
  const counts = getGenderCounts(attendees);
  
  // Increment the count for the new attendee's gender
  if (newGender === 'Male') counts.Male++;
  else if (newGender === 'Female') counts.Female++;
  else counts.Other++;
  
  // Calculate imbalance (absolute difference between male and female counts)
  const imbalance = Math.abs(counts.Male - counts.Female);
  
  // Return score: prefer tables with better gender balance
  return imbalance;
}

// Smart table selection with TRUE randomization and gender balancing
function selectBestTable(availableTables: Array<{ doc: QueryDocumentSnapshot<DocumentData>; data: Table }>, newGender: string) {
  if (availableTables.length === 0) {
    throw new Error('No available tables');
  }

  // FIRST: Shuffle the available tables to ensure true randomization
  // This is critical - we randomize BEFORE scoring
  const shuffledTables = [...availableTables].sort(() => Math.random() - 0.5);
  
  // Score each table based on:
  // 1. Gender balance (primary factor)
  // 2. Current occupancy with randomization factor
  // 3. Add random noise to prevent sequential filling
  
  const scoredTables = shuffledTables.map(({ doc, data }) => {
    const balanceScore = calculateGenderBalanceScore(data.attendees, newGender);
    const occupancyScore = data.seat_count;
    
    // Add random factor (0-2) to break ties and add variety
    const randomFactor = Math.random() * 2;
    
    // Combined score with weights:
    // - Gender balance: weight 15 (most important)
    // - Occupancy: weight 3 (prefer spreading across tables)
    // - Random factor: weight 1 (adds variety)
    const totalScore = (balanceScore * 15) + (occupancyScore * 3) + randomFactor;
    
    return { doc, data, totalScore, balanceScore, occupancyScore };
  });
  
  // Sort by total score (lowest is best)
  scoredTables.sort((a, b) => a.totalScore - b.totalScore);
  
  // SMART SELECTION:
  // Instead of just picking the best, we pick from the top 30% of tables
  // This ensures variety while still maintaining good gender balance
  const topCount = Math.max(1, Math.ceil(scoredTables.length * 0.3));
  const topTables = scoredTables.slice(0, topCount);
  
  // Randomly select from the top tables
  const randomIndex = Math.floor(Math.random() * topTables.length);
  return topTables[randomIndex].doc;
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
          
          let querySnapshot;
          
          try {
            // Query for tables with available seats (no specific ordering for randomization)
            const q = query(
              tablesRef,
              where('seat_count', '<', SEATS_PER_TABLE)
            );
            querySnapshot = await getDocs(q);
          } catch (indexError: unknown) {
            // Fallback: If index doesn't exist yet, get all tables and filter manually
            if (indexError instanceof Error && 'code' in indexError && (indexError as { code: string }).code === 'failed-precondition') {
              console.log('Index not ready, using fallback query...');
              const allTablesQuery = query(tablesRef);
              const allTables = await getDocs(allTablesQuery);
              
              // Filter manually for tables with available seats
              const availableTables = allTables.docs.filter(
                doc => (doc.data() as Table).seat_count < SEATS_PER_TABLE
              );
              
              // Create a mock QuerySnapshot with filtered docs
              querySnapshot = {
                docs: availableTables,
                empty: availableTables.length === 0
              } as { docs: typeof availableTables; empty: boolean };
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
          let assignedTableName: string;
          let seatNumber: number;

          // Check if we should create a new table for better distribution
          const shouldCreateNewTable = await (async () => {
            // If no tables exist, create first table
            if (querySnapshot.empty) return true;
            
            // Get count of all existing tables
            const allTablesQuery = query(tablesRef);
            const allTablesSnapshot = await getDocs(allTablesQuery);
            const currentTableCount = allTablesSnapshot.size;
            
            // If we haven't reached the table limit, consider creating new tables
            if (currentTableCount < TOTAL_TABLES) {
              // Calculate average occupancy across all tables
              let totalOccupancy = 0;
              allTablesSnapshot.docs.forEach(doc => {
                totalOccupancy += (doc.data() as Table).seat_count;
              });
              const avgOccupancy = totalOccupancy / currentTableCount;
              
              // SMART DISTRIBUTION LOGIC:
              // Create a new table if:
              // 1. Average occupancy is >= 3 (spreading out early registrations)
              // 2. Or with 40% probability when avg occupancy >= 2 (adds randomness)
              // This ensures users spread across multiple tables from the start
              if (avgOccupancy >= 3) {
                return true;
              } else if (avgOccupancy >= 2 && Math.random() < 0.4) {
                return true;
              }
            }
            
            return false;
          })();

          if (!querySnapshot.empty && !shouldCreateNewTable) {
            // GENDER-BALANCED RANDOMIZED ASSIGNMENT TO EXISTING TABLE
            const availableTables = querySnapshot.docs.map(doc => ({
              doc,
              data: doc.data() as Table
            }));
            
            // Use smart selection based on gender balance
            const selectedTable = selectBestTable(availableTables, sanitizedGender);
            
            const tableData = selectedTable.data() as Table;
            const tableRef = doc(db, TABLES_COLLECTION, selectedTable.id);

            const updatedAttendees = [...tableData.attendees, newAttendee];
            const updatedSeatCount = updatedAttendees.length;

            transaction.update(tableRef, {
              attendees: updatedAttendees,
              seat_count: updatedSeatCount,
            });

            assignedTableNumber = tableData.tableNumber;
            assignedTableName = TABLE_NAMES[tableData.tableNumber];
            seatNumber = updatedSeatCount;
          } else {
            // CREATE A NEW TABLE for better distribution
            // First, get all existing tables to find the best new table number
            const allTablesQuery = query(tablesRef);
            const allTablesSnapshot = await getDocs(allTablesQuery);
            
            // Find which table numbers are already used
            const usedTableNumbers = new Set<number>();
            allTablesSnapshot.docs.forEach(doc => {
              usedTableNumbers.add((doc.data() as Table).tableNumber);
            });
            
            // Ensure we don't exceed TOTAL_TABLES
            if (usedTableNumbers.size >= TOTAL_TABLES) {
              throw new Error('All tables are full. Maximum capacity reached.');
            }

            // RANDOMIZED TABLE NUMBER SELECTION
            // Find all available table numbers
            const availableTableNumbers: number[] = [];
            for (let i = 1; i <= TOTAL_TABLES; i++) {
              if (!usedTableNumbers.has(i)) {
                availableTableNumbers.push(i);
              }
            }
            
            // Randomly select from available table numbers for true randomization
            const randomIndex = Math.floor(Math.random() * availableTableNumbers.length);
            const newTableNumber = availableTableNumbers[randomIndex];

            const newTable: Omit<Table, 'table_id'> = {
              tableNumber: newTableNumber,
              tableName: TABLE_NAMES[newTableNumber],
              attendees: [newAttendee],
              seat_count: 1,
              maxCapacity: SEATS_PER_TABLE,
            };

            // Add new table
            await addDoc(tablesRef, {
              ...newTable,
              table_id: `table_${newTableNumber}`,
            });

            assignedTableNumber = newTableNumber;
            assignedTableName = TABLE_NAMES[newTableNumber];
            seatNumber = 1;
          }

          return {
            success: true,
            tableNumber: assignedTableNumber,
            tableName: assignedTableName,
            seatNumber,
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

    // Send confirmation email after successful registration (non-blocking)
    if (result?.success) {
      const qrData = JSON.stringify({
        name: result.name,
        email: sanitizedEmail,
        table: result.tableNumber,
        seat: result.seatNumber,
        phone: result.phone,
        gender: result.gender,
        event: 'CACSAUI Love Feast',
      });

      // Send email asynchronously without blocking the response
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                      'http://localhost:3000';
      
      console.log('Sending email to:', sanitizedEmail, 'via', baseUrl);

      fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sanitizedEmail,
          name: result.name,
          tableNumber: result.tableNumber,
          tableName: result.tableName,
          seatNumber: result.seatNumber,
          phone: result.phone,
          gender: result.gender,
          qrData,
        }),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(`Email API error: ${data.error || response.statusText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Email sent successfully:', data);
      })
      .catch(emailError => {
        // Log email error but don't fail the registration
        console.error('Failed to send confirmation email:', {
          error: emailError.message,
          to: sanitizedEmail,
          baseUrl,
        });
      });
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
