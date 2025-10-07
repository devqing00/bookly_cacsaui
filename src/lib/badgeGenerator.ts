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

  // Generate QR code with improved data structure and green color
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone || '',
      table: attendee.tableNumber,
      seat: attendee.seatNumber,
      event: 'CACSAUI Love Feast'
    }),
    { width: 300, margin: 1, color: { dark: '#166534', light: '#ffffff' } }
  );

  // Soft gradient background
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.rect(0, 0, 100, 150, 'F');

  // Top accent bar - Green gradient simulation
  pdf.setFillColor(34, 197, 94); // green-500
  pdf.rect(0, 0, 100, 3, 'F');

  // Header section with rounded corners effect
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(5, 8, 90, 35, 3, 3, 'F');
  
  // Add shadow effect with gray border
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.3);
  pdf.roundedRect(5, 8, 90, 35, 3, 3, 'S');

  // Event Logo/Title
  pdf.setTextColor(34, 197, 94); // green-500
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CACSAUI', 50, 18, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Love Feast', 50, 26, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text('University of Ibadan', 50, 32, { align: 'center' });

  // Decorative line
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(0.5);
  pdf.line(25, 37, 75, 37);

  // Attendee Name Section with background
  pdf.setFillColor(254, 252, 232); // yellow-50
  pdf.roundedRect(5, 48, 90, 18, 2, 2, 'F');
  
  pdf.setDrawColor(250, 204, 21); // yellow-400
  pdf.setLineWidth(0.2);
  pdf.roundedRect(5, 48, 90, 18, 2, 2, 'S');

  pdf.setFontSize(8);
  pdf.setTextColor(161, 98, 7); // yellow-800
  pdf.setFont('helvetica', 'bold');
  pdf.text('ATTENDEE', 50, 53, { align: 'center' });

  // Name - handle long names with wrapping
  pdf.setFontSize(14);
  pdf.setTextColor(17, 24, 39); // gray-900
  pdf.setFont('helvetica', 'bold');
  const nameLines = pdf.splitTextToSize(attendee.name, 85);
  const nameY = nameLines.length > 1 ? 59 : 61;
  pdf.text(nameLines, 50, nameY, { align: 'center', maxWidth: 85 });

  // Table and Seat Assignment - Prominent Display
  const assignmentY = 73;
  
  // Table Number Box
  pdf.setFillColor(34, 197, 94); // green-500
  pdf.roundedRect(15, assignmentY, 30, 25, 2, 2, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TABLE', 30, assignmentY + 6, { align: 'center' });
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.tableNumber.toString(), 30, assignmentY + 18, { align: 'center' });

  // Seat Number Box
  pdf.setFillColor(59, 130, 246); // blue-500
  pdf.roundedRect(55, assignmentY, 30, 25, 2, 2, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SEAT', 70, assignmentY + 6, { align: 'center' });
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.seatNumber.toString(), 70, assignmentY + 18, { align: 'center' });

  // QR Code Section with border
  const qrY = 105;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(25, qrY, 50, 50, 2, 2, 'F');
  
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(25, qrY, 50, 50, 2, 2, 'S');
  
  // Add QR code
  pdf.addImage(qrDataUrl, 'PNG', 30, qrY + 5, 40, 40);

  // Instructions text
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.setFont('helvetica', 'italic');
  pdf.text('Scan at entrance for quick check-in', 50, 161, { align: 'center' });

  // Footer decoration
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(0.3);
  pdf.line(20, 167, 80, 167);

  // Additional info in footer
  if (attendee.email || attendee.phone) {
    pdf.setFontSize(6);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.setFont('helvetica', 'normal');
    let footerY = 171;
    
    if (attendee.email) {
      const emailText = attendee.email.length > 35 ? attendee.email.substring(0, 32) + '...' : attendee.email;
      pdf.text(emailText, 50, footerY, { align: 'center' });
      footerY += 3;
    }
    
    if (attendee.phone) {
      pdf.text(attendee.phone, 50, footerY, { align: 'center' });
    }
  }

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
