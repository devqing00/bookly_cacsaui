import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Validate environment variables
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error("Missing email configuration:", {
    GMAIL_USER: process.env.GMAIL_USER ? "Set" : "Missing",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "Set" : "Missing",
  });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailRequest {
  to: string;
  name: string;
  tableNumber: number;
  tableName?: string;
  seatNumber: number;
  phone?: string;
  gender?: string;
  qrData: string;
}

export async function POST(request: Request) {
  try {
    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Email configuration missing in environment variables");
      return NextResponse.json(
        { 
          success: false, 
          error: "Email service not configured. Please contact administrator.",
          debug: {
            GMAIL_USER: process.env.GMAIL_USER ? "Set" : "Missing",
            GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "Set" : "Missing",
          }
        },
        { status: 500 }
      );
    }

    const {
      to,
      name,
      tableNumber,
      tableName,
      seatNumber,
      phone,
      gender,
      qrData,
    }: EmailRequest = await request.json();

    if (!to || !name || !tableNumber || !seatNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CACSAUI Love Feast - Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5">
  
  <!-- Main Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:40px 16px">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Hero Section with Decorative Corners -->
          <tr>
            <td style="background:linear-gradient(180deg,#4a1f1f 0%,#5c2a2a 50%,#4a1f1f 100%);padding:60px 40px;text-align:center">
              
              <!-- Event Branding -->
              <p style="margin:0 0 12px;font-size:11px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:2px">CACSAUI PRESENTS</p>
              
              <h1 style="margin:0 0 8px;font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1.1">LOVE FEAST</h1>
              
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.5px">2025</p>
              
              <table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px">
                <tr>
                  <td style="height:2px;background:#d4a244"></td>
                </tr>
              </table>
              
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:1px">Registration Confirmed</p>
              
              <p style="margin:0;font-size:13px;color:rgba(212,162,68,0.9);font-weight:600">University of Ibadan</p>
            </td>
          </tr>
          
          <!-- White Content Section -->
          <tr>
            <td style="padding:48px 40px">
              
              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:14px;color:#78716c;text-align:center">Hello,</p>
              <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#5c2a2a;text-align:center;text-transform:uppercase;letter-spacing:0.5px">${name}</h2>
              
              <p style="margin:0 0 40px;font-size:15px;color:#57534e;line-height:1.6;text-align:center">Your seat has been reserved! We're excited to celebrate with you at the Love Feast.</p>
              
              <!-- Table Assignment Card -->
              ${
                tableName
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;background:#fdf6e2;border-radius:8px">
                <tr>
                  <td style="padding:20px;text-align:center">
                    <p style="margin:0 0 8px;font-size:11px;color:#78716c;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">Your Table</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#5c2a2a;letter-spacing:0.5px">${tableName}</p>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              
              <!-- Split Cards: Table & Seat -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px">
                <tr>
                  <!-- Table Card -->
                  <td width="48%" style="vertical-align:top">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#5c2a2a;border-radius:12px">
                      <tr>
                        <td style="padding:32px 20px;text-align:center">
                          <!-- Icon Circle -->
                          <table role="presentation" width="40" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;background:#d4a244;border-radius:50%">
                            <tr>
                              <td style="width:40px;height:40px;text-align:center;vertical-align:middle;font-size:18px;font-weight:800;color:#fff">T</td>
                            </tr>
                          </table>
                          
                          <p style="margin:0 0 8px;font-size:10px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">Table</p>
                          <p style="margin:0;font-size:48px;font-weight:800;color:#fff;line-height:1">${tableNumber}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <td width="4%"></td>
                  
                  <!-- Seat Card -->
                  <td width="48%" style="vertical-align:top">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#d4a244;border-radius:12px">
                      <tr>
                        <td style="padding:32px 20px;text-align:center">
                          <!-- Icon Circle -->
                          <table role="presentation" width="40" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;background:#5c2a2a;border-radius:50%">
                            <tr>
                              <td style="width:40px;height:40px;text-align:center;vertical-align:middle;font-size:18px;font-weight:800;color:#fff">S</td>
                            </tr>
                          </table>
                          
                          <p style="margin:0 0 8px;font-size:10px;color:#5c2a2a;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">Seat</p>
                          <p style="margin:0;font-size:48px;font-weight:800;color:#5c2a2a;line-height:1">${seatNumber}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- QR Code Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;background:#fafafa;border-radius:12px">
                <tr>
                  <td style="padding:40px 32px;text-align:center">
                    <p style="margin:0 0 24px;font-size:13px;color:#5c2a2a;font-weight:700;text-transform:uppercase;letter-spacing:1px">Your Check-In QR Code</p>
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;padding:20px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(92,42,42,0.1);border:1px solid #f5f0e0">
                      <tr>
                        <td style="text-align:center">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            qrData
                          )}&color=5c2a2a&bgcolor=ffffff&margin=0" alt="QR Code" width="180" height="180" style="display:block;border-radius:6px"/>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:24px 0 0;font-size:13px;color:#78716c;line-height:1.6">Scan at entrance for quick check-in</p>
                  </td>
                </tr>
              </table>
              
              <!-- Attendee Details -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;border:1px solid #f0f0f0;border-radius:8px">
                <tr>
                  <td style="padding:24px">
                    <p style="margin:0 0 16px;font-size:11px;color:#78716c;font-weight:700;text-transform:uppercase;letter-spacing:1px">Attendee Information</p>
                    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:8px 0;vertical-align:top;width:80px">
                          <span style="font-size:13px;color:#a8a29e;font-weight:600">Name</span>
                        </td>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:14px;color:#1c1917;font-weight:500">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#f5f5f5"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:13px;color:#a8a29e;font-weight:600">Email</span>
                        </td>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:14px;color:#1c1917;word-break:break-all">${to}</span>
                        </td>
                      </tr>
                      ${
                        phone
                          ? `<tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#f5f5f5"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:13px;color:#a8a29e;font-weight:600">Phone</span>
                        </td>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:14px;color:#1c1917">${phone}</span>
                        </td>
                      </tr>`
                          : ""
                      }
                      ${
                        gender
                          ? `<tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#f5f5f5"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:13px;color:#a8a29e;font-weight:600">Gender</span>
                        </td>
                        <td style="padding:8px 0;vertical-align:top">
                          <span style="font-size:14px;color:#1c1917">${gender}</span>
                        </td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Important Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;background:linear-gradient(135deg,#fdf6e2 0%,#fcf1d0 100%);border-radius:8px;border-left:3px solid #d4a244">
                <tr>
                  <td style="padding:24px">
                    <p style="margin:0 0 16px;font-size:13px;color:#5c2a2a;font-weight:700">Important Information</p>
                    
                    <p style="margin:0 0 12px;font-size:14px;color:#5c4530;line-height:1.6">
                      <strong style="color:#5c2a2a">Arrival:</strong> Please arrive 15 minutes early
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;color:#5c4530;line-height:1.6">
                      <strong style="color:#5c2a2a">Check-In:</strong> Show QR code or provide email
                    </p>
                    <p style="margin:0;font-size:14px;color:#5c4530;line-height:1.6">
                      <strong style="color:#5c2a2a">Contact:</strong> cacsaui@uniibadan.edu.ng
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Closing Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:32px 24px;background:linear-gradient(135deg,#5c2a2a 0%,#4a1f1f 100%);border-radius:8px;text-align:center">
                    <p style="margin:0 0 8px;font-size:16px;color:#fff;font-weight:600;line-height:1.5">We look forward to seeing you!</p>
                    <p style="margin:0;font-size:18px;color:#d4a244;font-weight:700">God bless you 🙏</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;background:#fafafa;text-align:center;border-top:1px solid #f0f0f0">
              <p style="margin:0 0 8px;font-size:14px;color:#5c2a2a;font-weight:700">CACSAUI</p>
              <p style="margin:0 0 4px;font-size:12px;color:#78716c">Christ Apostolic Church Students Union</p>
              <p style="margin:0 0 16px;font-size:12px;color:#78716c">University of Ibadan</p>
              
              <!-- Decorative Footer Elements -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px">
                <tr>
                  <td style="padding:0 4px">
                    <div style="width:8px;height:8px;border-radius:50%;background:#5c2a2a"></div>
                  </td>
                  <td style="padding:0 4px">
                    <div style="width:6px;height:6px;border-radius:50%;background:#d4a244"></div>
                  </td>
                  <td style="padding:0 4px">
                    <div style="width:8px;height:8px;border-radius:50%;background:#5c2a2a"></div>
                  </td>
                </tr>
              </table>
              
              <p style="margin:16px 0 0;font-size:11px;color:#a8a29e">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;

    const info = await transporter.sendMail({
      from: `"CACSAUI Love Feast" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: "🎉 Love Feast Registration Confirmed - Your Table Assignment",
      html: htmlContent,
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      to: to,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId || "sent",
      message: "Confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
