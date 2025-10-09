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
    format: [100, 210],
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

  // ========== MODERN GRADIENT HERO SECTION ==========
  // Background gradient (burgundy to darker burgundy)
  // pdf.setFillColor(92, 42, 42); // burgundy-700
  // pdf.rect(0, 0, 100, 75, 'F');
  
  // Overlay darker gradient at top
  pdf.setFillColor(74, 31, 31); // burgundy-800
  pdf.rect(0, 0, 100, 100, 'F');
  
  // Golden accent stripe (modern diagonal feel)
  // pdf.setFillColor(212, 162, 68); // golden-500
  // pdf.rect(0, 70, 100, 5, 'F');

  // Decorative circles (modern geometric pattern) - positioned at corners
  // Top-left corner
  pdf.setFillColor(212, 162, 68); // golden
  pdf.circle(-10, -10, 40, 'F');
  
  // Top-right corner
  pdf.setFillColor(255, 255, 255); // white
  pdf.circle(110, -10, 40, 'F');
  
  // Bottom-left corner
  pdf.setFillColor(255, 255, 255); // white
  pdf.circle(-10, 100, 40, 'F');
  
  // Bottom-right corner
  pdf.setFillColor(212, 162, 68); // golden
  pdf.circle(110, 100, 40, 'F');

  // Event Title - Modern Typography
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CACSAUI PRESENTS', 50, 15, { align: 'center' });
  
  // Main Event Name - Bold & Large
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOVE FEAST', 50, 25, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2025', 50, 33, { align: 'center' });

  // Subtitle
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(212, 162, 68); // golden
  pdf.text('UNIVERSITY OF IBADAN', 50, 40, { align: 'center' });

  // Name Badge Section - Modern Card Style
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ATTENDEE', 50, 50, { align: 'center' });

  // Attendee Name - Large and Bold
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const nameLines = pdf.splitTextToSize(attendee.name.toUpperCase(), 90);
  const nameY = nameLines.length > 1 ? 56 : 58;
  pdf.text(nameLines, 50, nameY, { align: 'center', maxWidth: 90 });

  // Small decorative line under name
  pdf.setDrawColor(212, 162, 68); // golden
  pdf.setLineWidth(0.5);
  const lineY = nameLines.length > 1 ? 64 : 63;
  pdf.line(30, lineY, 70, lineY);

  // ========== WHITE CONTENT SECTION ==========
  // Clean white background for content
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 75, 100, 135, 'F');

  // ========== TABLE ASSIGNMENT - MODERN SPLIT DESIGN ==========
  const tableY = 80;
  
  // Table Name Banner (if exists)
  if (attendee.tableName) {
    pdf.setFillColor(253, 246, 226); // golden-100
    pdf.roundedRect(8, tableY, 84, 15, 2, 2, 'F');
    
    pdf.setFontSize(5);
    pdf.setTextColor(92, 42, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text('YOUR TABLE', 50, tableY + 4, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setTextColor(92, 42, 42);
    pdf.setFont('helvetica', 'bold');
    const tableNameLines = pdf.splitTextToSize(attendee.tableName, 80);
    pdf.text(tableNameLines, 50, tableY + 10, { align: 'center', maxWidth: 80 });
  }

  // Modern Number Cards - Side by Side with Icons
  const cardsY = attendee.tableName ? tableY + 18 : tableY;
  
  // Left Card - Table Number
  pdf.setFillColor(92, 42, 42); // burgundy
  pdf.roundedRect(8, cardsY, 40, 42, 3, 3, 'F');
  
  // Icon circle background
  pdf.setFillColor(212, 162, 68); // golden
  pdf.circle(28, cardsY + 10, 6, 'F');
  
  // Icon text
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('T', 28, cardsY + 12, { align: 'center' });
  
  // Label
  pdf.setFontSize(6);
  pdf.setTextColor(212, 162, 68);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TABLE', 28, cardsY + 22, { align: 'center' });
  
  // Number
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.tableNumber.toString(), 28, cardsY + 35, { align: 'center' });

  // Right Card - Seat Number
  pdf.setFillColor(212, 162, 68); // golden
  pdf.roundedRect(52, cardsY, 40, 42, 3, 3, 'F');
  
  // Icon circle background
  pdf.setFillColor(92, 42, 42); // burgundy
  pdf.circle(72, cardsY + 10, 6, 'F');
  
  // Icon text
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('S', 72, cardsY + 12, { align: 'center' });
  
  // Label
  pdf.setFontSize(6);
  pdf.setTextColor(92, 42, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SEAT', 72, cardsY + 22, { align: 'center' });
  
  // Number
  pdf.setFontSize(24);
  pdf.setTextColor(92, 42, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(attendee.seatNumber.toString(), 72, cardsY + 35, { align: 'center' });

  // ========== QR CODE SECTION - MODERN CENTERED ==========
  const qrY = cardsY + 50;
  
  // QR Background with shadow effect
  pdf.setFillColor(248, 248, 248); // very light gray
  pdf.roundedRect(28, qrY - 2, 44, 44, 3, 3, 'F');
  
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(30, qrY, 40, 40, 2, 2, 'F');
  
  // Thin golden border
  pdf.setDrawColor(212, 162, 68);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(30, qrY, 40, 40, 2, 2, 'S');
  
  // Add QR code
  pdf.addImage(qrDataUrl, 'PNG', 33, qrY + 3, 34, 34);

  // QR Instructions - Modern Style
  pdf.setFontSize(7);
  pdf.setTextColor(92, 42, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SCAN TO CHECK IN', 50, qrY + 48, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setTextColor(120, 113, 108);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Present this at the entrance', 50, qrY + 53, { align: 'center' });

  // ========== BOTTOM FOOTER - MODERN MINIMAL ==========
  // Decorative elements
  pdf.setFillColor(92, 42, 42);
  pdf.circle(10, 202, 1.5, 'F');
  pdf.circle(90, 202, 1.5, 'F');
  
  pdf.setFillColor(212, 162, 68);
  pdf.circle(15, 202, 1, 'F');
  pdf.circle(85, 202, 1, 'F');

  // Bottom text
  pdf.setFontSize(5);
  pdf.setTextColor(168, 162, 158);
  pdf.setFont('helvetica', 'normal');
  pdf.text('An evening of fellowship & celebration', 50, 206, { align: 'center' });

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
    
    // ===== MODERN HORIZONTAL BADGE DESIGN =====
    
    // Background - white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 85.6, 54, 'F');

    // Left Section - Burgundy Hero (30% width)
    pdf.setFillColor(92, 42, 42); // burgundy-700
    pdf.rect(0, 0, 25, 54, 'F');
    
    // Darker overlay at top
    pdf.setFillColor(74, 31, 31); // burgundy-800
    pdf.rect(0, 0, 25, 20, 'F');

    // Golden accent vertical stripe
    pdf.setFillColor(212, 162, 68); // golden-500
    pdf.rect(24, 0, 1, 54, 'F');

    // Decorative circles on left
    pdf.setFillColor(212, 162, 68, 0.1);
    pdf.circle(-5, 10, 12, 'F');
    pdf.circle(30, 45, 15, 'F');

    // Event Title on left section - Vertical orientation feel
    pdf.setFontSize(7);
    pdf.setTextColor(212, 162, 68);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CACSAUI', 12.5, 12, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LOVE', 12.5, 20, { align: 'center' });
    pdf.text('FEAST', 12.5, 27, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.text('2025', 12.5, 34, { align: 'center' });

    // Small subtitle
    pdf.setFontSize(4);
    pdf.setTextColor(212, 162, 68);
    pdf.setFont('helvetica', 'normal');
    pdf.text('UI', 12.5, 42, { align: 'center' });

    // Right Section - Content
    const contentStartX = 28;
    
    // Attendee Name - Top Priority
    pdf.setFontSize(11);
    pdf.setTextColor(92, 42, 42);
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(attendee.name.toUpperCase() || '', 52);
    pdf.text(nameLines, contentStartX, 10, { maxWidth: 52 });

    // Small divider
    pdf.setDrawColor(212, 162, 68);
    pdf.setLineWidth(0.3);
    pdf.line(contentStartX, 14, contentStartX + 25, 14);

    // Table Name (if exists)
    let currentY = 18;
    if (attendee.tableName) {
      pdf.setFontSize(5);
      pdf.setTextColor(120, 113, 108);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TABLE', contentStartX, currentY);
      
      pdf.setFontSize(8);
      pdf.setTextColor(92, 42, 42);
      pdf.setFont('helvetica', 'bold');
      const tableNameLines = pdf.splitTextToSize(attendee.tableName, 52);
      pdf.text(tableNameLines, contentStartX, currentY + 4, { maxWidth: 52 });
      currentY += tableNameLines.length > 1 ? 10 : 8;
    }

    // Number Cards - Compact Side by Side
    const cardsY = currentY + 2;
    
    // Table Card - Burgundy
    pdf.setFillColor(92, 42, 42);
    pdf.roundedRect(contentStartX, cardsY, 22, 18, 2, 2, 'F');
    
    pdf.setFontSize(5);
    pdf.setTextColor(212, 162, 68);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TABLE', contentStartX + 11, cardsY + 5, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(attendee.tableNumber.toString(), contentStartX + 11, cardsY + 14, { align: 'center' });

    // Seat Card - Golden
    pdf.setFillColor(212, 162, 68);
    pdf.roundedRect(contentStartX + 24, cardsY, 22, 18, 2, 2, 'F');
    
    pdf.setFontSize(5);
    pdf.setTextColor(92, 42, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SEAT', contentStartX + 35, cardsY + 5, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(92, 42, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(attendee.seatNumber.toString(), contentStartX + 35, cardsY + 14, { align: 'center' });

    // QR Code - Top Right Corner
    const qrSize = 16;
    const qrX = 85.6 - qrSize - 3;
    const qrY = 3;
    
    // QR background
    pdf.setFillColor(248, 248, 248);
    pdf.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
    
    const qrData = JSON.stringify({
      name: attendee.name,
      email: attendee.email,
      table: attendee.tableNumber,
      tableName: attendee.tableName || '',
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
          dark: '#5C2A2A',
          light: '#FFFFFF',
        },
      });

      const qrImageData = canvas.toDataURL('image/png');
      pdf.addImage(qrImageData, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (error) {
      console.error('QR code generation error:', error);
    }

    // Bottom instruction text
    pdf.setFontSize(4);
    pdf.setTextColor(168, 162, 158);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan QR to check in', contentStartX, 50);
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
