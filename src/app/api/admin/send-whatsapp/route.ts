import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Table, Attendee } from '@/types';
import { getTableName } from '@/types';
import { generateBadgePDF } from '@/lib/badgeGenerator';

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

// Helper function to find user by phone
async function findUserByPhone(phone: string): Promise<UserLookupResult> {
  const tablesRef = collection(db, TABLES_COLLECTION);
  const tablesSnapshot = await getDocs(tablesRef);
  
  // Normalize phone for comparison
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

// Helper function to find user by email (fallback)
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

// POST - Send WhatsApp message with badge
export async function POST(request: Request) {
  try {
    const { phone, email } = await request.json();

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'Phone number or email is required' },
        { status: 400 }
      );
    }

    // Find the user by phone or email
    const result = phone 
      ? await findUserByPhone(phone)
      : await findUserByEmail(email);

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { attendee } = result;

    if (!attendee.phone) {
      return NextResponse.json(
        { success: false, error: 'No phone number registered for this user' },
        { status: 400 }
      );
    }

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

    // Generate badge PDF
    const badgePDF = await generateBadgePDF({
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
      gender: attendee.gender,
      tableNumber: attendee.tableNumber,
      tent: attendee.tent,
      tableName: attendee.tableName,
      seatNumber: attendee.seatNumber,
      qrCodeData: qrData,
    });

    // Convert PDF blob to base64
    const arrayBuffer = await badgePDF.arrayBuffer();
    const base64PDF = Buffer.from(arrayBuffer).toString('base64');

    // Prepare WhatsApp message
    const message = `
🎉 *CACSAUI Love Feast 2025*

Hello ${attendee.name}! 👋

Your registration is confirmed! Here are your details:

📋 *Event Details:*
━━━━━━━━━━━━━━━━
🏛️ Table: ${attendee.tableName}
🎪 Tent: ${attendee.tent}
💺 Seat Number: ${attendee.seatNumber}

📅 *Event Information:*
━━━━━━━━━━━━━━━━
📍 Venue: [Event Location]
📆 Date: [Event Date]
🕐 Time: [Event Time]

⚠️ *Important Instructions:*
━━━━━━━━━━━━━━━━
✅ Please download and save your badge (attached)
✅ Show your badge QR code at the entrance
✅ Arrive 30 minutes before the event
✅ Keep this message for reference

Your personalized badge with QR code is attached to this message.

See you at the Love Feast! 🍽️✨

_CACSAUI Love Feast Team_
    `.trim();

    // Check for WhatsApp API configuration
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
      console.error('WhatsApp API not configured');
      
      // For development/testing: Return success with instructions
      return NextResponse.json({
        success: true,
        message: 'WhatsApp API not configured. In production, message would be sent.',
        devInfo: {
          to: attendee.phone,
          messagePreview: message.substring(0, 100) + '...',
          badgeGenerated: true,
          attendee: {
            name: attendee.name,
            phone: attendee.phone,
            tableNumber: attendee.tableNumber,
            tent: attendee.tent,
            seatNumber: attendee.seatNumber,
          },
        },
      });
    }

    // Send WhatsApp message via API
    // This uses a generic approach - adapt to your WhatsApp provider (Twilio, WhatsApp Business API, etc.)
    try {
      const whatsappResponse = await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        },
        body: JSON.stringify({
          to: attendee.phone,
          type: 'document',
          document: {
            filename: `CACSAUI_LoveFeast_Badge_${attendee.name.replace(/\s+/g, '_')}.pdf`,
            caption: message,
            data: base64PDF,
          },
        }),
      });

      if (!whatsappResponse.ok) {
        const errorData = await whatsappResponse.json();
        throw new Error(errorData.message || 'WhatsApp API request failed');
      }

      const responseData = await whatsappResponse.json();

      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: responseData.id || responseData.messageId,
        attendee: {
          name: attendee.name,
          phone: attendee.phone,
          tableNumber: attendee.tableNumber,
          tent: attendee.tent,
          tableName: attendee.tableName,
          seatNumber: attendee.seatNumber,
        },
      });
    } catch (whatsappError) {
      console.error('WhatsApp sending failed:', whatsappError);
      return NextResponse.json(
        {
          success: false,
          error: whatsappError instanceof Error ? whatsappError.message : 'Failed to send WhatsApp message',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message';
    console.error('Error in WhatsApp sending:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Preview WhatsApp message (for testing)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'Phone number or email is required' },
        { status: 400 }
      );
    }

    const result = phone 
      ? await findUserByPhone(phone)
      : await findUserByEmail(email!);

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { attendee } = result;

    if (!attendee.phone) {
      return NextResponse.json(
        { success: false, error: 'No phone number registered for this user' },
        { status: 400 }
      );
    }

    const messagePreview = `
Hello ${attendee.name}!

Your CACSAUI Love Feast registration is confirmed!

Table: ${attendee.tableName}
Tent: ${attendee.tent}
Seat: ${attendee.seatNumber}

A badge with QR code will be attached when sent.
    `.trim();

    return NextResponse.json({
      success: true,
      preview: {
        to: attendee.phone,
        message: messagePreview,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          tableNumber: attendee.tableNumber,
          tent: attendee.tent,
          seatNumber: attendee.seatNumber,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to preview message';
    console.error('Error previewing WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
