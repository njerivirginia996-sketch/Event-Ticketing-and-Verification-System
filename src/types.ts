export type UserRole = 'super_admin' | 'organizer' | 'gate_staff' | 'attendee';

export interface PortalCodes {
  super_admin: string;
  organizer: string;
  gate_staff: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended';
  organizationId?: string;
  avatarUrl?: string;
  googleId?: string;
  password?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  logo?: string;
  payoutDetails: {
    bankName?: string;
    accountNumber?: string;
    mpesaNumber?: string;
    paybill?: string;
  };
  status: 'approved' | 'pending' | 'suspended';
  createdAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  held: number; // Temporarily held during checkout
  saleStart: string;
  saleEnd: string;
  maxPerOrder: number;
  perks: string[];
}

export interface PromoCode {
  id: string;
  eventId?: string; // Optional: can be event-specific or platform-wide
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number;
  used: number;
  expiresAt: string;
}

export interface EventItem {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: 'Concert' | 'Conference' | 'Festival' | 'Sports' | 'Food & Drink' | 'Theater';
  venue: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: 'published' | 'draft' | 'cancelled';
  bannerUrl: string;
  organizerName: string;
  allowReentry?: boolean;
  ticketTypes?: TicketType[];
  minPrice?: number;
  maxPrice?: number;
}

export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'REFUNDED' | 'TRANSFERRED';

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  ticketNumber: string;
  qrToken: string;
  signature: string;
  status: TicketStatus;
  checkedInAt?: string;
  checkedInBy?: string;
  gate?: string;
  createdAt: string;
  transferredTo?: string;
}

export interface OrderItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  eventId: string;
  eventTitle: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  platformFee: number;
  total: number;
  promoCode?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'mpesa' | 'card';
  paymentReference?: string;
  ticketIds: string[];
  createdAt: string;
}

export interface ScanLog {
  id: string;
  ticketId: string;
  ticketNumber: string;
  eventId: string;
  staffId: string;
  staffName: string;
  gate: string;
  result: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'TRANSFERRED' | 'WRONG_EVENT';
  timestamp: string;
  deviceId: string;
  message?: string;
  isOfflineSynced?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface StaffAssignment {
  id: string;
  eventId: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  gate: string;
}

export interface PayoutRequest {
  id: string;
  orgId: string;
  orgName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedBy?: string;
  payoutDetails: string;
}

export interface TicketHold {
  holdToken: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  expiresAt: number; // timestamp ms
}
