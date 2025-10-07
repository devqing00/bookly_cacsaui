import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  to: string;
  name: string;
  tableNumber: number;
  seatNumber: number;
  phone?: string;
  gender?: string;
  qrData: string;
}

export async function POST(request: Request) {
  try {
    const { to, name, tableNumber, seatNumber, phone, gender, qrData }: EmailRequest = await request.json();

    if (!to || !name || !tableNumber || !seatNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CACSAUI Love Feast Registration Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #22c55e;
    }
    .header h1 {
      color: #22c55e;
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #666;
      font-size: 16px;
      margin: 0;
    }
    .success-icon {
      text-align: center;
      margin-bottom: 20px;
    }
    .success-icon svg {
      width: 60px;
      height: 60px;
      fill: #22c55e;
    }
    .info-card {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin: 20px 0;
      text-align: center;
    }
    .info-card h2 {
      font-size: 24px;
      margin: 0 0 20px 0;
    }
    .assignment {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 20px 0;
    }
    .assignment-item {
      text-align: center;
    }
    .assignment-item .label {
      font-size: 12px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .assignment-item .value {
      font-size: 32px;
      font-weight: bold;
    }
    .details {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .details-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-row .label {
      font-weight: 600;
      color: #4b5563;
      width: 120px;
    }
    .details-row .value {
      color: #111827;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .qr-section h3 {
      color: #374151;
      margin-bottom: 15px;
    }
    .qr-section p {
      color: #6b7280;
      font-size: 14px;
      margin-top: 15px;
    }
    .instructions {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions h3 {
      color: #92400e;
      margin-top: 0;
      font-size: 18px;
    }
    .instructions ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      color: #78350f;
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Registration Confirmed!</h1>
      <p>CACSAUI Love Feast - University of Ibadan</p>
    </div>

    <div class="success-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"/>
      </svg>
    </div>

    <p style="text-align: center; font-size: 18px; color: #374151; margin-bottom: 30px;">
      Hello <strong>${name}</strong>,<br>
      Your registration for the Love Feast has been confirmed!
    </p>

    <div class="info-card">
      <h2>Your Table Assignment</h2>
      <div class="assignment">
        <div class="assignment-item">
          <div class="label">Table Number</div>
          <div class="value">${tableNumber}</div>
        </div>
        <div class="assignment-item">
          <div class="label">Seat Number</div>
          <div class="value">${seatNumber}</div>
        </div>
      </div>
    </div>

    <div class="details">
      <h3 style="margin-top: 0; color: #111827;">Registration Details</h3>
      <div class="details-row">
        <div class="label">Name:</div>
        <div class="value">${name}</div>
      </div>
      <div class="details-row">
        <div class="label">Email:</div>
        <div class="value">${to}</div>
      </div>
      ${phone ? `
      <div class="details-row">
        <div class="label">Phone:</div>
        <div class="value">${phone}</div>
      </div>
      ` : ''}
      ${gender ? `
      <div class="details-row">
        <div class="label">Gender:</div>
        <div class="value">${gender}</div>
      </div>
      ` : ''}
    </div>

    <div class="qr-section">
      <h3>Your Check-In QR Code</h3>
      <div style="display: inline-block; padding: 20px; background: white; border-radius: 8px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR Code" style="display: block; width: 200px; height: 200px;">
      </div>
      <p>Show this QR code at the entrance for quick check-in</p>
    </div>

    <div class="instructions">
      <h3>📋 Important Information</h3>
      <ul>
        <li><strong>Arrive early:</strong> Please arrive at least 10 minutes before the Love Feast begins</li>
        <li><strong>Table capacity:</strong> Each table accommodates up to 6 guests</li>
        <li><strong>Check-in:</strong> Use the QR code above or provide your email at the entrance</li>
        <li><strong>Questions?</strong> Contact us at ${process.env.EMAIL_REPLY_TO || 'cacsaui@uniibadan.edu.ng'}</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
        We look forward to seeing you at the Love Feast!
      </p>
      <p style="color: #22c55e; font-weight: 600; font-size: 18px; margin: 0;">
        God bless you! 🙏
      </p>
    </div>

    <div class="footer">
      <p><strong>CACSAUI - Christ Apostolic Church Students Union, University of Ibadan</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CACSAUI Love Feast <noreply@resend.dev>',
      to: [to],
      replyTo: process.env.EMAIL_REPLY_TO || 'cacsaui@uniibadan.edu.ng',
      subject: '🎉 Love Feast Registration Confirmed - Your Table Assignment',
      html: htmlContent,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id || 'sent',
      message: 'Confirmation email sent successfully',
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return success even if email fails to not block registration
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }, { status: 500 });
  }
}
