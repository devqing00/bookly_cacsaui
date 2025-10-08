import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface BadgeData {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  tableNumber: number;
  tableName?: string;
  seatNumber: number;
}

export async function generateBadgePDF(attendee: BadgeData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150], // Badge size: 100mm x 150mm
  });

  // Generate QR code with burgundy color
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone || '',
      table: attendee.tableNumber,
      tableName: attendee.tableName || '',
      seat: attendee.seatNumber,
      event: 'CACSAUI Love Feast'
    }),
    { width: 300, margin: 1, color: { dark: '#5C2A2A', light: '#ffffff' } }
  );

  // Background - soft golden tint
  pdf.setFillColor(254, 252, 243); // golden-50
  pdf.rect(0, 0, 100, 150, 'F');

  // Top accent bar - burgundy gradient
  pdf.setFillColor(92, 42, 42); // burgundy-700
  pdf.rect(0, 0, 100, 4, 'F');
  
  // Golden accent bar below
  pdf.setFillColor(212, 162, 68); // golden-500
  pdf.rect(0, 4, 100, 1, 'F');

  // Event Header Section
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(5, 10, 90, 30, 3, 3, 'F');
  
  pdf.setDrawColor(212, 162, 68); // golden-500 border
  pdf.setLineWidth(0.4);
  pdf.roundedRect(5, 10, 90, 30, 3, 3, 'S');

  // Event Logo/Title
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CACSAUI', 50, 19, { align: 'center' });
  
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Love Feast 2025', 50, 27, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(120, 113, 108); // neutral-500
  pdf.text('University of Ibadan', 50, 34, { align: 'center' });

  // Decorative line
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.6);
  pdf.line(20, 37, 80, 37);

  // Attendee Name Section
  pdf.setFillColor(253, 246, 226); // golden-100
  pdf.roundedRect(5, 45, 90, 20, 2, 2, 'F');
  
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.3);
  pdf.roundedRect(5, 45, 90, 20, 2, 2, 'S');

  pdf.setFontSize(7);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text('ATTENDEE', 50, 50, { align: 'center' });

  // Name - handle long names
  pdf.setFontSize(13);
  pdf.setTextColor(23, 23, 23); // neutral-900
  pdf.setFont('helvetica', 'bold');
  const nameLines = pdf.splitTextToSize(attendee.name, 85);
  const nameY = nameLines.length > 1 ? 56 : 59;
  pdf.text(nameLines, 50, nameY, { align: 'center', maxWidth: 85 });

  // Table Assignment Card - Main Feature
  const cardY = 70;
  
  // Card background with gradient effect
  pdf.setFillColor(253, 246, 226); // golden-100
  pdf.roundedRect(5, cardY, 90, 48, 3, 3, 'F');
  
  // Border - golden
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.5);
  pdf.roundedRect(5, cardY, 90, 48, 3, 3, 'S');

  // Table Name Header
  pdf.setFontSize(6);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR ASSIGNED TABLE', 50, cardY + 5, { align: 'center' });

  // Table Name - wrap if too long
  pdf.setFontSize(11);
  pdf.setTextColor(74, 31, 31); // burgundy-800
  pdf.setFont('helvetica', 'bold');
  const tableName = attendee.tableName || `Table ${attendee.tableNumber}`;
  const tableNameLines = pdf.splitTextToSize(tableName, 85);
  const tableNameY = cardY + (tableNameLines.length > 1 ? 11 : 12);
  pdf.text(tableNameLines, 50, tableNameY, { align: 'center', maxWidth: 85 });

  // Divider line
  const dividerY = cardY + (tableNameLines.length > 1 ? 20 : 18);
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.3);
  pdf.line(15, dividerY, 85, dividerY);

  // Table Number and Seat - Side by side
  const numbersY = dividerY + 7;
  
  // Table Number (Left)
  pdf.setFontSize(6);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text('TABLE NUMBER', 30, numbersY, { align: 'center' });
  
  pdf.setFontSize(28);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.tableNumber.toString(), 30, numbersY + 12, { align: 'center' });

  // Seat Number (Right)
  pdf.setFontSize(6);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text('SEAT', 70, numbersY, { align: 'center' });
  
  pdf.setFontSize(22);
  pdf.setTextColor(92, 42, 42); // burgundy-700
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.seatNumber.toString(), 70, numbersY + 11, { align: 'center' });

  // Seat indicator dots
  const dotsY = cardY + 43;
  const dotStartX = 18;
  const dotSpacing = 9;
  
  for (let i = 0; i < 8; i++) {
    if (i < attendee.seatNumber) {
      pdf.setFillColor(212, 162, 68); // golden-500 - filled
    } else {
      pdf.setFillColor(229, 231, 235); // neutral-200 - empty
    }
    pdf.circle(dotStartX + (i * dotSpacing), dotsY, 1.5, 'F');
  }

  // QR Code Section
  const qrY = 124;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(30, qrY, 40, 40, 2, 2, 'F');
  
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.4);
  pdf.roundedRect(30, qrY, 40, 40, 2, 2, 'S');
  
  // Add QR code
  pdf.addImage(qrDataUrl, 'PNG', 33, qrY + 3, 34, 34);

  // QR Instructions
  pdf.setFontSize(6);
  pdf.setTextColor(120, 113, 108); // neutral-500
  pdf.setFont('helvetica', 'italic');
  pdf.text('Show this QR code at check-in', 50, 168, { align: 'center' });

  // Footer decoration
  pdf.setDrawColor(212, 162, 68); // golden-500
  pdf.setLineWidth(0.3);
  pdf.line(25, 171, 75, 171);

  // Gender icon (small, subtle)
  if (attendee.gender) {
    pdf.setFontSize(5);
    pdf.setTextColor(168, 162, 158); // neutral-400
    pdf.setFont('helvetica', 'normal');
    const genderText = attendee.gender === 'Male' ? 'M' : attendee.gender === 'Female' ? 'F' : 'O';
    pdf.text(genderText, 8, 174);
  }

  return pdf.output('blob');
}

/**
 * Generate a batch of badges in a single PDF
 * Each badge appears on a separate page
 */
export async function generateBatchBadgesPDF(attendees: BadgeData[]): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [85.6, 54],
    compress: true,
  });

  for (let i = 0; i < attendees.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const attendee = attendees[i];
    
    // Background
    pdf.setFillColor(254, 252, 243); // golden-50
    pdf.rect(0, 0, 85.6, 54, 'F');

    // Top burgundy bar
    pdf.setFillColor(92, 42, 42); // burgundy-700
    pdf.rect(0, 0, 85.6, 4, 'F');

    // Secondary golden accent bar
    pdf.setFillColor(212, 162, 68); // golden-500
    pdf.rect(0, 4, 85.6, 1, 'F');

    // CACSAUI Love Feast Title
    pdf.setFontSize(9);
    pdf.setTextColor(92, 42, 42); // burgundy-700
    pdf.setFont('helvetica', 'bold');
    pdf.text('CACSAUI LOVE FEAST', 42.8, 10, { align: 'center' });

    // Event Date
    pdf.setFontSize(7);
    pdf.setTextColor(113, 113, 122); // neutral-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('October 11, 2025', 42.8, 15, { align: 'center' });

    // Name
    pdf.setFontSize(13);
    pdf.setTextColor(23, 23, 23); // neutral-900
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(attendee.name || '', 72);
    pdf.text(nameLines, 42.8, 22, { align: 'center' });

    // Table Assignment Label
    pdf.setFontSize(7);
    pdf.setTextColor(113, 113, 122); // neutral-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('YOUR ASSIGNED TABLE', 42.8, 30, { align: 'center' });

    // Table Name
    if (attendee.tableName) {
      pdf.setFontSize(11);
      pdf.setTextColor(92, 42, 42); // burgundy-700
      pdf.setFont('helvetica', 'bold');
      const tableNameLines = pdf.splitTextToSize(attendee.tableName, 72);
      pdf.text(tableNameLines, 42.8, 35, { align: 'center' });
    }

    // Table & Seat numbers side by side
    const yPosition = attendee.tableName ? 42 : 37;
    
    // Table Number
    pdf.setFontSize(28);
    pdf.setTextColor(92, 42, 42); // burgundy-700
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${attendee.tableNumber}`, 28, yPosition, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setTextColor(113, 113, 122); // neutral-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('TABLE', 28, yPosition + 5, { align: 'center' });

    // Seat Number
    pdf.setFontSize(22);
    pdf.setTextColor(212, 162, 68); // golden-600
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${attendee.seatNumber}`, 57, yPosition, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setTextColor(113, 113, 122); // neutral-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('SEAT', 57, yPosition + 5, { align: 'center' });

    // 8 Seat Indicator Dots
    const dotY = 50;
    const dotSpacing = 5;
    const startX = 42.8 - (7 * dotSpacing) / 2;
    
    for (let j = 0; j < 8; j++) {
      const x = startX + j * dotSpacing;
      if (j + 1 === attendee.seatNumber) {
        pdf.setFillColor(212, 162, 68); // golden-500 - active seat
      } else {
        pdf.setFillColor(229, 231, 235); // neutral-200 - inactive seat
      }
      pdf.circle(x, dotY, 1.5, 'F');
    }

    // QR Code
    const qrData = JSON.stringify({
      name: attendee.name,
      email: attendee.email,
      table: attendee.tableNumber,
      seat: attendee.seatNumber,
      phone: attendee.phone,
      gender: attendee.gender,
      event: 'CACSAUI Love Feast',
    });

    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#5C2A2A', // burgundy-700
          light: '#FFFFFF',
        },
      });

      const qrImageData = canvas.toDataURL('image/png');
      pdf.addImage(qrImageData, 'PNG', 69, 6, 14, 14);
    } catch (error) {
      console.error('QR code generation error:', error);
    }

    // Gender indicator (optional)
    if (attendee.gender) {
      pdf.setFontSize(8);
      pdf.setTextColor(113, 113, 122);
      pdf.setFont('helvetica', 'bold');
      const genderText = attendee.gender === 'Male' ? 'M' : attendee.gender === 'Female' ? 'F' : 'O';
      pdf.text(genderText, 8, 174);
    }
  }

  return pdf.output('blob');
}

export function downloadBadge(pdfBlob: Blob, filename: string) {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
