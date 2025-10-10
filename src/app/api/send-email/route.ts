import { NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/sendConfirmationEmail";

interface EmailRequest {
  to: string;
  name: string;
  tableNumber: number;
  tent: number;
  tableName?: string;
  seatNumber: number;
  phone?: string;
  gender?: string;
  qrData: string;
}

export async function POST(request: Request) {
  try {
    console.log("=== Email API Route Called ===");

    const {
      to,
      name,
      tableNumber,
      tent,
      tableName,
      seatNumber,
      phone,
      gender,
      qrData,
    }: EmailRequest = await request.json();

    if (!to || !name || !tableNumber || !tent || !seatNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the shared email utility function
    const result = await sendConfirmationEmail({
      to,
      name,
      tableNumber,
      tent,
      tableName,
      seatNumber,
      phone,
      gender,
      qrData,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId || "sent",
        message: "Confirmation email sent successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in email API route:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
