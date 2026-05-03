export type EventStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELED';

export interface EventDto {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  capacity: number;
  notes: string;
  invitedGuestsCount?: number;
}

export interface EventFormValues {
  name: string;
  slug: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  capacity: string;
  notes: string;
}

export interface CreateEventRequest {
  name: string;
  slug: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  capacity: number;
  notes: string;
}

export interface UpdateEventRequest extends CreateEventRequest {}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export const EVENT_STATUS_OPTIONS: EventStatus[] = [
  'DRAFT',
  'ACTIVE',
  'CLOSED',
  'CANCELED',
];

export const defaultEventFormValues: EventFormValues = {
  name: '',
  slug: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  status: 'DRAFT',
  capacity: '',
  notes: '',
};
