import nodemailer from "nodemailer";

interface EmailOptions {
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

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendConfirmationEmail(
  options: EmailOptions
): Promise<EmailResult> {
  try {
    console.log("=== Sending Confirmation Email ===");
    console.log("Email request for:", {
      to: options.to,
      name: options.name,
      tableNumber: options.tableNumber,
      seatNumber: options.seatNumber,
    });

    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Email configuration missing in environment variables");
      return {
        success: false,
        error: "Email service not configured. Please contact administrator.",
      };
    }

    // Validate required fields
    if (
      !options.to ||
      !options.name ||
      !options.tableNumber ||
      !options.seatNumber
    ) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Create transporter
    console.log("Creating nodemailer transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const {
      to,
      name,
      tableNumber,
      tableName,
      seatNumber,
      phone,
      gender,
      qrData,
    } = options;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CACSAUI Love Feast - Registration Confirmed</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#1a1a1a">
  
  <!-- Main Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;padding:40px 16px">
    <tr>
      <td align="center">
        
        <!-- Email Card with Black & Gold Theme -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#000;box-shadow:0 8px 32px rgba(212,162,68,0.2);border:1px solid #2a2a2a">
          
          <!-- Hero Section - Black Background with Gold Accents -->
          <tr>
            <td style="background:#000;padding:60px 40px;text-align:center;position:relative">
                           
              <!-- Trophy/Award Icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px">
                <tr>
                  <td style="width:50px;height:50px;border-radius:50%;background:#d4a244;text-align:center;vertical-align:middle">
                    <span style="font-size:28px;line-height:50px">🏆</span>
                  </td>
                </tr>
              </table>
              
              <!-- Event Subtitle -->
              <p style="margin:0 0 16px;font-size:11px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:3px">CACSAUI PRESENTS</p>
              
              <!-- Large Event Title - Gold (Playfair Display) -->
              <h1 style="margin:0 0 12px;font-family:'Playfair Display', serif;font-size:56px;font-weight:900;color:#d4a244;letter-spacing:-2px;line-height:1;text-shadow:0 2px 8px rgba(212,162,68,0.3)">Love Feast</h1>
              
              <p style="margin:0 0 24px;font-size:32px;font-weight:700;color:#d4a244;letter-spacing:1px">2025</p>
              
              <!-- Elegant Gold Divider -->
              <table role="presentation" width="120" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px">
                <tr>
                  <td style="height:2px;background:linear-gradient(90deg,transparent,#d4a244,transparent)"></td>
                </tr>
              </table>
              
              <p style="margin:0 0 8px;font-size:13px;color:#fff;text-transform:uppercase;letter-spacing:2px;font-weight:600">Admission Confirmed</p>
              
              <p style="margin:0;font-size:12px;color:#999;font-weight:500">University of Ibadan</p>
            </td>
          </tr>
          
          <!-- White Content Section with Premium Feel -->
          <tr>
            <td style="padding:48px 40px;background:#fff">
              
              <!-- Personalized Greeting -->
              <p style="margin:0 0 8px;font-size:13px;color:#666;text-align:center;text-transform:uppercase;letter-spacing:1px">Welcome</p>
              <h2 style="margin:0 0 32px;font-size:28px;font-weight:700;color:#000;text-align:center;text-transform:uppercase;letter-spacing:1px">${name}</h2>
              
              <p style="margin:0 0 48px;font-size:16px;color:#333;line-height:1.8;text-align:center">Your exclusive admission has been confirmed. We're honored to celebrate this special evening with you at the Love Feast.</p>
              
              <!-- Tent Information Card (if available) -->
              ${
                options.tent
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);border-radius:12px;border:2px solid #d4a244">
                <tr>
                  <td style="padding:24px;text-align:center">
                    <p style="margin:0 0 8px;font-size:10px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:2px">Tent Assignment</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:#d4a244;text-shadow:0 2px 4px rgba(212,162,68,0.3)">Tent ${options.tent}</p>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              
              <!-- Premium Admission Details - Ticket Stub Style -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;background:#000;border-radius:16px;overflow:hidden;border:2px solid #d4a244">
                <tr>
                  <!-- Left Section - Event Info -->
                  <td width="65%" style="padding:40px 32px;vertical-align:top;border-right:2px dashed #d4a244">
                    <p style="margin:0 0 12px;font-size:10px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:2px">Event Details</p>
                    
                    <p style="margin:0 0 8px;font-size:13px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">THEME:</strong> Love: A Commandment and Calling <br/><i>John 13:34, 1 Peter 1:23</i>
                    </p>
                    <p style="margin:0 0 8px;font-size:13px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">DATE:</strong> October 12th, 2025
                    </p>
                    <p style="margin:0 0 8px;font-size:13px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">VENUE:</strong> Bello Hall, University of Ibadan.
                    </p>
                    <p style="margin:0;font-size:13px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">TIME:</strong> 11:30 AM
                    </p>
                  </td>
                  
                  <!-- Right Section - Admission Stub -->
                  <td width="35%" style="padding:40px 24px;vertical-align:top;text-align:center;background:#0a0a0a">
                    <p style="margin:0 0 20px;font-size:9px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:2px">Admit One</p>
                    
                    <!-- Table Number -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;background:#d4a244;border-radius:8px">
                      <tr>
                        <td style="padding:12px;text-align:center">
                          <p style="margin:0 0 4px;font-size:9px;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:1px">Table</p>
                          <p style="margin:0;font-size:32px;font-weight:800;color:#000;line-height:1">${tableNumber}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Seat Number -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;background:#fff;border-radius:8px">
                      <tr>
                        <td style="padding:12px;text-align:center">
                          <p style="margin:0 0 4px;font-size:9px;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:1px">Seat</p>
                          <p style="margin:0;font-size:32px;font-weight:800;color:#000;line-height:1">${seatNumber}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${
                tableName
                  ? `<!-- Table Name - Premium Banner -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;background:linear-gradient(135deg,#d4a244 0%,#c99437 100%);border-radius:12px;box-shadow:0 4px 16px rgba(212,162,68,0.3)">
                <tr>
                  <td style="padding:24px;text-align:center">
                    <p style="margin:0 0 8px;font-size:10px;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:2px">Your Table</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#000;letter-spacing:0.5px;line-height:1.4">${tableName}</p>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              
              <!-- QR Code Section - Premium -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;background:#f8f8f8;border-radius:16px;border:1px solid #e0e0e0">
                <tr>
                  <td style="padding:40px 32px;text-align:center">
                    <p style="margin:0 0 24px;font-size:12px;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:2px">Your Check-In Code</p>
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;padding:20px;background:#000;border-radius:16px;border:3px solid #d4a244">
                      <tr>
                        <td style="text-align:center">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            qrData
                          )}&color=d4a244&bgcolor=000000&margin=0" alt="QR Code" width="180" height="180" style="display:block;border-radius:8px"/>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:24px 0 0;font-size:13px;color:#666;line-height:1.6">Scan this code at the entrance for express check-in</p>
                  </td>
                </tr>
              </table>
              
              <!-- Attendee Information - Premium Style -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;border:2px solid #000;border-radius:12px">
                <tr>
                  <td style="padding:32px">
                    <p style="margin:0 0 20px;font-size:10px;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #d4a244;padding-bottom:12px">Attendee Information</p>
                    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:100px">
                          <span style="font-size:13px;color:#666;font-weight:600">Name</span>
                        </td>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:14px;color:#000;font-weight:600">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#e0e0e0"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:13px;color:#666;font-weight:600">Email</span>
                        </td>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:14px;color:#000;word-break:break-all">${to}</span>
                        </td>
                      </tr>
                      ${
                        phone
                          ? `<tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#e0e0e0"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:13px;color:#666;font-weight:600">Phone</span>
                        </td>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:14px;color:#000">${phone}</span>
                        </td>
                      </tr>`
                          : ""
                      }
                      ${
                        gender
                          ? `<tr>
                        <td colspan="2" style="padding:4px 0">
                          <div style="height:1px;background:#e0e0e0"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:13px;color:#666;font-weight:600">Gender</span>
                        </td>
                        <td style="padding:10px 0;vertical-align:top">
                          <span style="font-size:14px;color:#000">${gender}</span>
                        </td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Important Information - Premium Alert Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;background:#000;border-radius:12px;border-left:4px solid #d4a244">
                <tr>
                  <td style="padding:32px">
                    <p style="margin:0 0 20px;font-size:12px;color:#d4a244;font-weight:700;text-transform:uppercase;letter-spacing:2px">Important Guidelines</p>
                    
                    <p style="margin:0 0 16px;font-size:14px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">⏰ Arrival:</strong> Please arrive 15 minutes before event time
                    </p>
                    <p style="margin:0 0 16px;font-size:14px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">✓ Check-In:</strong> Present QR code or provide your email
                    </p>
                    <p style="margin:0 0 16px;font-size:14px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">👔 Dress Code:</strong> Smart casual attire recommended
                    </p>
                    <p style="margin:0;font-size:14px;color:#fff;line-height:1.8">
                      <strong style="color:#d4a244">📧 Contact:</strong> adetayoalexander00@gmail.com
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Closing Message - Premium Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 32px;background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);border-radius:12px;text-align:center;border:2px solid #d4a244">
                    <p style="margin:0 0 12px;font-size:20px;color:#fff;font-weight:700;line-height:1.4">We look forward to celebrating with you!</p>
                    <p style="margin:0;font-size:24px;color:#d4a244;font-weight:700">God bless you 🙏</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer - Black & Gold Theme -->
          <tr>
            <td style="padding:40px;background:#000;text-align:center;border-top:2px solid #d4a244">
              <p style="margin:0 0 8px;font-size:16px;color:#d4a244;font-weight:700;letter-spacing:2px">CACSAUI</p>
              <p style="margin:0 0 4px;font-size:13px;color:#999">Christ Apostolic Church Students Union</p>
              <p style="margin:0 0 24px;font-size:13px;color:#999">University of Ibadan</p>
              
              <!-- Decorative Footer Elements -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px">
                <tr>
                  <td style="padding:0 6px">
                    <div style="width:10px;height:10px;border-radius:50%;background:#d4a244"></div>
                  </td>
                  <td style="padding:0 6px">
                    <div style="width:6px;height:6px;border-radius:50%;background:#666"></div>
                  </td>
                  <td style="padding:0 6px">
                    <div style="width:10px;height:10px;border-radius:50%;background:#d4a244"></div>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0;font-size:11px;color:#666">This is an automated confirmation. Please do not reply to this email.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;

    console.log("Sending email via nodemailer...");
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

    return {
      success: true,
      messageId: info.messageId || "sent",
    };
  } catch (error) {
    console.error("Error sending email:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
