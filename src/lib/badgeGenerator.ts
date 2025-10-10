import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { MONTSERRAT_BASE64, RAKKAS_BASE64 } from './embeddedFonts';

export interface BadgeData {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  tableNumber: number;
  tent: number;
  tableName?: string;
  seatNumber: number;
  qrCodeData?: string;
}

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  
  try {
    const pdfApi: any = (jsPDF as any).API;
    
    // Register Montserrat (use as default for body text)
    pdfApi.addFileToVFS('Montserrat-Regular.ttf', MONTSERRAT_BASE64);
    pdfApi.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
    pdfApi.addFont('Montserrat-Regular.ttf', 'Montserrat', 'bold'); // Variable font handles weights
    
    // Register Rakkas (decorative display font)
    pdfApi.addFileToVFS('Rakkas-Regular.ttf', RAKKAS_BASE64);
    pdfApi.addFont('Rakkas-Regular.ttf', 'Rakkas', 'normal');
    
    fontsRegistered = true;
    console.log('✓ Fonts registered successfully');
  } catch (err) {
    console.error('Font registration failed:', err);
  }
}

export async function generateBadgePDF(attendee: BadgeData): Promise<Blob> {
  // Landscape ticket: 8" x 2.5" (203.2mm x 63.5mm)
  const W = 203.2;
  const H = 63.5;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [H, W] });
  
  registerFonts();

  // Load trophy image
  let trophyImage: string | undefined = undefined;
  try {
    const response = await fetch('/images/trophy.png');
    if (response.ok) {
      const blob = await response.blob();
      trophyImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Trophy image not found, using vector fallback', err);
  }

  // Generate QR code
  let qrDataUrl: string | undefined = undefined;
  try {
    qrDataUrl = await QRCode.toDataURL(
      attendee.qrCodeData || JSON.stringify(attendee),
      { width: 400, margin: 0, color: { dark: '#D4A244', light: '#000000' } }
    );
  } catch (err) {
    console.error('QR generation failed', err);
  }

  renderTicket(pdf, attendee, qrDataUrl, trophyImage);
  return pdf.output('blob');
}

function renderTicket(pdf: any, attendee: BadgeData, qrCode?: string, trophyImageData?: string) {
  const W = 203.2;
  const H = 63.5;
  
  // Layout configuration
  const STUB_WIDTH = 42; // Wider stub for better layout
  const PERF_X = W - STUB_WIDTH;
  const LEFT_MARGIN = 12;
  
  // === BACKGROUND ===
  pdf.setFillColor(18, 18, 18); // Deep black
  pdf.rect(0, 0, W, H, 'F');
  
  // === WHITE STUB (Right Side) ===
  pdf.setFillColor(255, 255, 255);
  pdf.rect(PERF_X, 0, STUB_WIDTH, H, 'F');
  
  // Perforation with better serrated edge
  pdf.setFillColor(18, 18, 18);
  for (let y = 0; y < H; y += 3.5) {
    pdf.triangle(PERF_X - 1, y, PERF_X + 0.8, y + 1.75, PERF_X - 1, y + 3.5, 'F');
  }
  
  // === LEFT: TROPHY ICON ===
  const trophyX = 5;
  const trophyY = 5;
  const trophySize = 50;
  
  if (trophyImageData) {
    try {
      pdf.addImage(trophyImageData, 'PNG', trophyX, trophyY, trophySize, trophySize);
    } catch (err) {
      console.warn('Trophy image failed, using fallback');
    }
  }
  
  if (!trophyImageData) {
    // Enhanced vector trophy
    pdf.setFillColor(212, 162, 68);
    const cx = trophyX + trophySize / 2;
    pdf.triangle(trophyX + 4, trophyY + trophySize * 0.45, 
                 cx, trophyY + 2, 
                 trophyX + trophySize - 4, trophyY + trophySize * 0.45, 'F');
    pdf.rect(trophyX + 3, trophyY + trophySize * 0.42, trophySize - 6, 3.5, 'F');
    pdf.rect(cx - 2.5, trophyY + trophySize * 0.5, 5, trophySize * 0.22, 'F');
    pdf.rect(trophyX + 2, trophyY + trophySize * 0.72, trophySize - 4, 5, 'F');
  }
  
  // === CENTER: EVENT DETAILS with proper hierarchy ===
  const contentX = trophyX + trophySize + 10;
  let currentY = 12;
  
  // Overline (subtle, uppercase, spaced)
  pdf.setFont('Montserrat', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(160, 140, 100);
  pdf.text('C A C S A U I  P R E S E N T S', contentX, currentY);
  currentY += 12;
  
  // Main Title (Large, decorative font)
  pdf.setFont('Rakkas', 'normal');
  pdf.setFontSize(36);
  pdf.setTextColor(212, 162, 68);
  pdf.text('LOVE FEAST', contentX, currentY);
  currentY += 12;
  
  // Decorative divider
  pdf.setDrawColor(212, 162, 68);
  pdf.setLineWidth(0.3);
  pdf.line(contentX, currentY, PERF_X - 10, currentY);
  currentY += 8;
  
  // Event Details (clean, readable hierarchy)
  pdf.setFont('Montserrat', 'normal');
  pdf.setFontSize(6.2);
  pdf.setTextColor(220, 220, 220);
  
  const details = [
    { label: 'THEME', value: 'Love: A Commandment and Calling' },
    { label: 'DATE', value: 'October 12th, 2025' },
    { label: 'VENUE', value: 'Bello Hall, University of Ibadan' },
    { label: 'TIME', value: '11:30 AM' },
  ];
  
  details.forEach((detail) => {
    pdf.setTextColor(200, 180, 120);
    pdf.text(detail.label + ':', contentX, currentY);
    pdf.setTextColor(220, 220, 220);
    pdf.text(detail.value, contentX + 18, currentY);
    currentY += 3.8;
  });
  
  // === RIGHT STUB: GUEST INFORMATION (Redesigned) ===
  const stubX = PERF_X + 4;
  const stubInnerWidth = STUB_WIDTH - 8;
  let stubY = 6;
  
  // Stub header
  pdf.setFont('Montserrat', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(40, 40, 40);
  pdf.text('GUEST PASS', stubX, stubY);
  stubY += 4;
  
  // Gold accent line
  pdf.setDrawColor(212, 162, 68);
  pdf.setLineWidth(0.5);
  pdf.line(stubX, stubY - 1, stubX + stubInnerWidth, stubY - 1);
  stubY += 2.5;
  
  // Guest name (wrapped if needed)
  pdf.setFont('Montserrat', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 30, 30);
  const nameLines = pdf.splitTextToSize(attendee.name.toUpperCase(), stubInnerWidth);
  nameLines.slice(0, 2).forEach((line: string) => {
    pdf.text(line, stubX, stubY);
    stubY += 3.2;
  });
  stubY += 1;
  
  // Info cards (redesigned with better spacing)
  const cardW = stubInnerWidth;
  const cardH = 8;
  
  const drawCard = (label: string, value: string | number, color: 'gold' | 'white') => {
    const isGold = color === 'gold';
    
    // Card background
    pdf.setFillColor(isGold ? 212 : 248, isGold ? 162 : 248, isGold ? 68 : 248);
    pdf.roundedRect(stubX, stubY, cardW, cardH, 1.2, 1.2, 'F');
    
    // Label (small, uppercase)
    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(5.2);
    pdf.setTextColor(40, 40, 40);
    pdf.text(label, stubX + 2.5, stubY + 3.2);
    
    // Value (large, bold, right-aligned)
    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(20, 20, 20);
    pdf.text(String(value), stubX + cardW - 2.5, stubY + 6.5, { align: 'right' });
    
    stubY += cardH + 1.5;
  };
  
  drawCard('TENT', attendee.tent, 'gold');
  drawCard('TABLE', attendee.tableNumber, 'white');
  drawCard('SEAT', attendee.seatNumber, 'gold');
  
  stubY += 1.5;
  
  // QR Code (properly centered and sized to fit)
  if (qrCode) {
    const qrSize = 14; // Slightly smaller to ensure it fits
    const qrX = stubX + (stubInnerWidth - qrSize) / 2;
    
    // White background for QR
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(qrX - 1, stubY - 1, qrSize + 2, qrSize + 2, 0.8, 0.8, 'F');
    
    // QR code
    pdf.addImage(qrCode, 'PNG', qrX, stubY, qrSize, qrSize);
  }
}

export async function generateBatchBadgesPDF(attendees: BadgeData[]): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [63.5, 203.2],
    compress: true,
  });

  registerFonts();

  // Load trophy image once for all badges
  let trophyImage: string | undefined = undefined;
  try {
    const response = await fetch('/images/trophy.png');
    if (response.ok) {
      const blob = await response.blob();
      trophyImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Trophy image not found for batch, using vector fallback', err);
  }

  for (let i = 0; i < attendees.length; i++) {
    if (i > 0) pdf.addPage();
    
    const attendee = attendees[i];
    let qrDataUrl: string | undefined = undefined;
    
    try {
      qrDataUrl = await QRCode.toDataURL(
        JSON.stringify(attendee),
        { width: 400, margin: 0, color: { dark: '#D4A244', light: '#000000' } }
      );
    } catch (err) {
      console.warn('QR generation failed for batch', err);
    }

    renderTicket(pdf, attendee, qrDataUrl, trophyImage);
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
