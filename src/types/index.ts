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

// Table configuration constants
export const TOTAL_TABLES = 9;
export const SEATS_PER_TABLE = 8;
export const TOTAL_CAPACITY = TOTAL_TABLES * SEATS_PER_TABLE; // 72 seats

// Special table names
export const TABLE_NAMES: Record<number, string> = {
  1: "Elohim – The Creator; Supreme God",
  2: "El Elyon – God Most High",
  3: "El Olam – The Everlasting God",
  4: "El Shaddai – God Almighty",
  5: "El Roi – The God Who Sees",
  6: "El Bethel – God of the House of God",
  7: "El Nora – The Awesome God",
  8: "El Shama – God Who Hears",
  9: "El Kadosh – The Holy God"
};

export interface Table {
  table_id: string;
  tableNumber: number;
  tableName: string;
  attendees: Attendee[];
  seat_count: number;
  maxCapacity: number;
}

export interface RegistrationResponse {
  success: boolean;
  tableNumber?: number;
  tableName?: string;
  name?: string;
  email?: string;
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
    tableName: string;
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
  metadata?: Record<string, unknown>;
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
  tableName: string;
  seatNumber: number;
  gender: string;
  phone: string;
  qrCodeData: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  registrationDetails: {
    name: string;
    tableNumber: number;
    tableName: string;
    seatNumber: number;
    gender: string;
    phone: string;
  };
  qrCodeData: string;
}
