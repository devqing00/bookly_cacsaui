export interface Attendee {
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  registeredAt: Date;
  checkedIn?: boolean;
  checkedInAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

export interface Table {
  table_id: string;
  tableNumber: number;
  attendees: Attendee[];
  seat_count: number;
  maxCapacity: number;
}

export interface RegistrationResponse {
  success: boolean;
  tableNumber?: number;
  name?: string;
  error?: string;
  isExisting?: boolean;
  seatNumber?: number;
  phone?: string;
  gender?: string;
}

export interface CheckRegistrationResponse {
  exists: boolean;
  registration?: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    tableNumber: number;
    seatNumber: number;
    registeredAt: string;
    checkedIn?: boolean;
    checkedInAt?: string;
  };
  error?: string;
}

export interface AdminStats {
  totalTables: number;
  totalAttendees: number;
  averageTableCapacity: number;
  fullTables: number;
  availableSeats: number;
  checkedInCount: number;
  deletedCount: number;
}

export interface ActivityLog {
  id?: string;
  action: 'register' | 'edit' | 'delete' | 'restore' | 'check-in' | 'email-sent';
  performedBy: string; // admin email or 'system'
  targetUser: string; // affected user email
  attendeeName?: string; // Name of the attendee
  attendeeEmail?: string; // Email of the attendee
  tableNumber?: number; // Table number
  seatNumber?: number; // Seat number
  details: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DeletedRegistration {
  id?: string;
  attendee: Attendee;
  originalTable: number;
  originalSeat: number;
  deletedBy: string;
  deletedAt: Date;
  reason?: string;
}

export interface CheckInRecord {
  email: string;
  name: string;
  tableNumber: number;
  seatNumber: number;
  checkedInAt: Date;
  checkedInBy: string;
}

export interface BadgeData {
  name: string;
  email: string;
  tableNumber: number;
  seatNumber: number;
  gender: string;
  qrCodeData: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  registrationDetails: {
    name: string;
    tableNumber: number;
    seatNumber: number;
    gender: string;
    phone: string;
  };
  qrCodeData: string;
}
