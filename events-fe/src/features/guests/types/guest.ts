export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface GuestDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface GuestFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface UpdateGuestRequest extends CreateGuestRequest {}

export type InvitationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED';

export type AttendanceStatus =
  | 'NOT_ARRIVED'
  | 'CHECKED_IN'
  | 'MANUAL_CHECKED_IN';

export interface EventSummaryDto {
  id: number;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface EventRegistrationDto {
  id: number;
  eventId: number;
  eventName: string;
  guestId: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  qrToken: string;
  invitationStatus: InvitationStatus;
  attendanceStatus: AttendanceStatus;
  invitationSentAt?: string | null;
  invitationErrorMessage?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  manualCheckInReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  canceledAt?: string | null;
}

export interface InvitationSendResultDto {
  success: boolean;
  skipped: boolean;
  message: string;
  emailLogId?: number | null;
  eventId?: number | null;
  registrationId?: number | null;
  guestId?: number | null;
  emailTo?: string | null;
  subject?: string | null;
  status?: string | null;
  sentAt?: string | null;
  errorMessage?: string | null;
}

export interface BulkInvitationSendResultDto {
  success: boolean;
  message: string;
  totalRequested: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  results: InvitationSendResultDto[];
}

export interface CreateEventRegistrationRequest {
  guestId: number;
  notes: string;
}

export const INVITATION_STATUS_OPTIONS: InvitationStatus[] = [
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'OPENED',
];

export const ATTENDANCE_STATUS_OPTIONS: AttendanceStatus[] = [
  'NOT_ARRIVED',
  'CHECKED_IN',
  'MANUAL_CHECKED_IN',
];

export const defaultGuestFormValues: GuestFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
};
