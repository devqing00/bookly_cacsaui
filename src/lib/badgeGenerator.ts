import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface BadgeData {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  tableNumber: number;
  seatNumber: number;
}

export async function generateBadgePDF(attendee: BadgeData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150], // Badge size: 100mm x 150mm
  });

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(
    `Name: ${attendee.name}\nEmail: ${attendee.email}\nPhone: ${attendee.phone || 'N/A'}\nTable: ${attendee.tableNumber}\nSeat: ${attendee.seatNumber}`,
    { width: 200, margin: 1 }
  );

  // Background gradient (light green to blue)
  pdf.setFillColor(240, 253, 244);
  pdf.rect(0, 0, 100, 150, 'F');

  // Header section with gradient effect
  pdf.setFillColor(34, 197, 94);
  pdf.rect(0, 0, 100, 30, 'F');

  // Event title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CACSAUI Love Feast', 50, 12, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('University of Ibadan', 50, 20, { align: 'center' });

  // Attendee name
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const nameLines = pdf.splitTextToSize(attendee.name, 85);
  pdf.text(nameLines, 50, 42, { align: 'center' });

  // Email
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  const emailLines = pdf.splitTextToSize(attendee.email, 85);
  pdf.text(emailLines, 50, 52, { align: 'center' });

  // Phone (if available)
  if (attendee.phone) {
    pdf.setFontSize(9);
    pdf.text(attendee.phone, 50, 60, { align: 'center' });
  }

  // Table and Seat info box
  const yPos = attendee.phone ? 70 : 65;
  
  // Box background
  pdf.setFillColor(239, 246, 255);
  pdf.roundedRect(15, yPos, 70, 18, 3, 3, 'F');
  
  // Border
  pdf.setDrawColor(147, 197, 253);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(15, yPos, 70, 18, 3, 3, 'S');

  // Table and Seat text
  pdf.setTextColor(29, 78, 216);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Table ${attendee.tableNumber}`, 30, yPos + 8, { align: 'left' });
  pdf.text(`Seat ${attendee.seatNumber}`, 30, yPos + 14, { align: 'left' });

  // Gender badge (if available)
  if (attendee.gender) {
    pdf.setFillColor(243, 232, 255);
    pdf.roundedRect(15, yPos + 22, 30, 8, 2, 2, 'F');
    pdf.setTextColor(126, 34, 206);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(attendee.gender, 30, yPos + 27, { align: 'center' });
  }

  // QR Code
  const qrYPos = attendee.gender ? yPos + 35 : yPos + 25;
  pdf.addImage(qrDataUrl, 'PNG', 25, qrYPos, 50, 50);

  // Footer text
  pdf.setFontSize(7);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Scan for check-in', 50, qrYPos + 55, { align: 'center' });

  return pdf.output('blob');
}

export async function generateBatchBadgesPDF(attendees: BadgeData[]): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const badgesPerPage = 4; // 2x2 grid on A4
  const badgeWidth = 100;
  const badgeHeight = 140;
  const marginX = 5;
  const marginY = 10;

  for (let i = 0; i < attendees.length; i++) {
    const attendee = attendees[i];
    
    // Add new page if needed
    if (i > 0 && i % badgesPerPage === 0) {
      pdf.addPage();
    }

    const positionIndex = i % badgesPerPage;
    const col = positionIndex % 2;
    const row = Math.floor(positionIndex / 2);
    
    const xPos = marginX + col * (badgeWidth + marginX);
    const yPos = marginY + row * (badgeHeight + marginY);

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(
      `Name: ${attendee.name}\nEmail: ${attendee.email}\nPhone: ${attendee.phone || 'N/A'}\nTable: ${attendee.tableNumber}\nSeat: ${attendee.seatNumber}`,
      { width: 150, margin: 1 }
    );

    // Badge background
    pdf.setFillColor(240, 253, 244);
    pdf.rect(xPos, yPos, badgeWidth, badgeHeight, 'F');

    // Border
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.3);
    pdf.rect(xPos, yPos, badgeWidth, badgeHeight, 'S');

    // Header
    pdf.setFillColor(34, 197, 94);
    pdf.rect(xPos, yPos, badgeWidth, 22, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CACSAUI Love Feast', xPos + badgeWidth / 2, yPos + 10, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('University of Ibadan', xPos + badgeWidth / 2, yPos + 16, { align: 'center' });

    // Name
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(attendee.name, badgeWidth - 10);
    pdf.text(nameLines, xPos + badgeWidth / 2, yPos + 32, { align: 'center', maxWidth: badgeWidth - 10 });

    // Email
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    const emailLines = pdf.splitTextToSize(attendee.email, badgeWidth - 10);
    pdf.text(emailLines, xPos + badgeWidth / 2, yPos + 40, { align: 'center', maxWidth: badgeWidth - 10 });

    // Table info
    const infoYPos = yPos + 50;
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(xPos + 10, infoYPos, badgeWidth - 20, 14, 2, 2, 'F');
    
    pdf.setTextColor(29, 78, 216);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Table ${attendee.tableNumber} • Seat ${attendee.seatNumber}`, xPos + badgeWidth / 2, infoYPos + 9, { align: 'center' });

    // QR Code
    pdf.addImage(qrDataUrl, 'PNG', xPos + 25, infoYPos + 18, 50, 50);

    // Footer
    pdf.setFontSize(6);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Scan for check-in', xPos + badgeWidth / 2, infoYPos + 72, { align: 'center' });
  }

  return pdf.output('blob');
}

export function downloadBadge(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
