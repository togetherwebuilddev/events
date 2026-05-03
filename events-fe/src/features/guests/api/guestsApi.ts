import { axiosClient } from '../../../api/client/axiosClient';
import {
  AttendanceStatus,
  BulkInvitationSendResultDto,
  CreateEventRegistrationRequest,
  CreateGuestRequest,
  EventRegistrationDto,
  GuestDto,
  InvitationSendResultDto,
  PaginatedResponse,
  UpdateGuestRequest,
} from '../types/guest';

const GUESTS_BASE_PATH = '/api/admin/guests';
const REGISTRATIONS_BASE_PATH = '/api/admin/registrations';
const EMAILS_BASE_PATH = '/api/admin/emails';
const CHECKIN_BASE_PATH = '/api/checkin';
const AUTH_BASE_PATH = '/api/auth';

type BackendGuestDto = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  notes?: string | null;
};

type BackendRegistrationDto = {
  id: number;
  eventId: number;
  eventName: string;
  guestId: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  qrToken?: string | null;
  invitationStatus:
    | 'PENDING'
    | 'SENT'
    | 'DELIVERED'
    | 'FAILED'
    | 'OPENED';
  attendanceStatus: 'NOT_ARRIVED' | 'CHECKED_IN' | 'MANUAL_CHECKED_IN';
  invitationSentAt?: string | null;
  invitationErrorMessage?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  manualCheckInReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  canceledAt?: string | null;
};

type BackendCheckInResponseDto = {
  success: boolean;
  registrationId?: number | null;
  guestId?: number | null;
  attendanceStatus?: 'NOT_ARRIVED' | 'CHECKED_IN' | 'MANUAL_CHECKED_IN' | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  message?: string | null;
};

type BackendCsrfResponse = {
  token: string;
};

async function withCsrfHeaders() {
  const response = await axiosClient.get<BackendCsrfResponse>(`${AUTH_BASE_PATH}/csrf`);

  return {
    'X-XSRF-TOKEN': response.data.token,
  };
}

function extractFileNameFromDisposition(dispositionHeader?: string) {
  if (!dispositionHeader) {
    return null;
  }

  const utfMatch = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = dispositionHeader.match(/filename="([^"]+)"/i) ?? dispositionHeader.match(/filename=([^;]+)/i);
  if (!basicMatch?.[1]) {
    return null;
  }

  return basicMatch[1].trim().replace(/^"|"$/g, '');
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function mapGuestFromBackend(guest: BackendGuestDto): GuestDto {
  return {
    id: guest.id,
    firstName: guest.firstName ?? '',
    lastName: guest.lastName ?? '',
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    company: guest.companyName ?? '',
    notes: guest.notes ?? '',
  };
}

function mapRegistrationFromBackend(registration: BackendRegistrationDto): EventRegistrationDto {
  return {
    id: registration.id,
    eventId: registration.eventId,
    eventName: registration.eventName ?? '',
    guestId: registration.guestId,
    guestFirstName: registration.guestFirstName ?? '',
    guestLastName: registration.guestLastName ?? '',
    guestEmail: registration.guestEmail ?? '',
    guestPhone: registration.guestPhone ?? '',
    qrToken: registration.qrToken ?? '',
    invitationStatus: registration.invitationStatus,
    attendanceStatus: registration.attendanceStatus,
    invitationSentAt: registration.invitationSentAt ?? null,
    invitationErrorMessage: registration.invitationErrorMessage ?? null,
    checkedInAt: registration.checkedInAt ?? null,
    checkedInBy: registration.checkedInBy ?? null,
    manualCheckInReason: registration.manualCheckInReason ?? null,
    notes: registration.notes ?? null,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt ?? null,
    canceledAt: registration.canceledAt ?? null,
  };
}

function paginateItems<T>(items: T[], page: number, size: number): PaginatedResponse<T> {
  const startIndex = page * size;
  const paginatedItems = items.slice(startIndex, startIndex + size);

  return {
    items: paginatedItems,
    page,
    size,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}

export const guestsApi = {
  async getGuests(page: number, size: number, search?: string) {
    const response = await axiosClient.get<BackendGuestDto[]>(GUESTS_BASE_PATH);
    const mappedItems = response.data.map(mapGuestFromBackend);
    const normalizedSearch = search?.trim().toLowerCase() ?? '';

    const filteredItems = normalizedSearch
      ? mappedItems.filter((guest) =>
          [guest.firstName, guest.lastName, guest.email, guest.company]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : mappedItems;

    return paginateItems(filteredItems, page, size);
  },

  async getGuestOptions(search?: string) {
    const response = await axiosClient.get<BackendGuestDto[]>(GUESTS_BASE_PATH);
    const mappedItems = response.data.map(mapGuestFromBackend);
    const normalizedSearch = search?.trim().toLowerCase() ?? '';

    return normalizedSearch
      ? mappedItems.filter((guest) =>
          [guest.firstName, guest.lastName, guest.email, guest.company]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : mappedItems;
  },

  async createGuest(payload: CreateGuestRequest) {
    const response = await axiosClient.post<BackendGuestDto>(
      GUESTS_BASE_PATH,
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        companyName: payload.company,
        notes: payload.notes,
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return mapGuestFromBackend(response.data);
  },

  async updateGuest(id: number, payload: UpdateGuestRequest) {
    const response = await axiosClient.put<BackendGuestDto>(
      `${GUESTS_BASE_PATH}/${id}`,
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        companyName: payload.company,
        notes: payload.notes,
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return mapGuestFromBackend(response.data);
  },

  async deleteGuest(id: number) {
    await axiosClient.delete(`${GUESTS_BASE_PATH}/${id}`, {
      headers: await withCsrfHeaders(),
    });
  },

  async getEventRegistrations(
    eventId: string,
    page: number,
    size: number,
    search?: string,
    status?: AttendanceStatus | ''
  ) {
    const response = await axiosClient.get<BackendRegistrationDto[]>(REGISTRATIONS_BASE_PATH);
    const mappedItems = response.data
      .map(mapRegistrationFromBackend)
      .filter((registration) => String(registration.eventId) === eventId);

    const normalizedSearch = search?.trim().toLowerCase() ?? '';

    const filteredItems = normalizedSearch
      ? mappedItems.filter((registration) =>
          [
            registration.guestFirstName,
            registration.guestLastName,
            registration.guestEmail,
            registration.eventName,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : mappedItems;

    const statusFilteredItems = status
      ? filteredItems.filter((registration) => registration.attendanceStatus === status)
      : filteredItems;

    return paginateItems(statusFilteredItems, page, size);
  },

  async getAllRegistrations() {
    const response = await axiosClient.get<BackendRegistrationDto[]>(REGISTRATIONS_BASE_PATH);
    return response.data.map(mapRegistrationFromBackend);
  },

  async createEventRegistration(eventId: string, payload: CreateEventRegistrationRequest) {
    const response = await axiosClient.post<BackendRegistrationDto>(
      REGISTRATIONS_BASE_PATH,
      {
        eventId: Number(eventId),
        guestId: payload.guestId,
        notes: payload.notes,
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return mapRegistrationFromBackend(response.data);
  },

  async deleteEventRegistration(registrationId: number) {
    await axiosClient.delete(`${REGISTRATIONS_BASE_PATH}/${registrationId}`, {
      headers: await withCsrfHeaders(),
    });
  },

  async cancelEventRegistration(registrationId: number) {
    await axiosClient.post(
      `${REGISTRATIONS_BASE_PATH}/${registrationId}/cancel`,
      {},
      {
        headers: await withCsrfHeaders(),
      }
    );
  },

  async sendRegistrationEmail(_eventId: string, registrationId: number, subject?: string) {
    const response = await axiosClient.post<InvitationSendResultDto>(
      `${EMAILS_BASE_PATH}/send-invitation`,
      {
        registrationId,
        subject: subject || undefined,
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return response.data;
  },

  async sendBulkRegistrationEmails(
    registrationIds: number[],
    subject: string,
    body?: string
  ) {
    const response = await axiosClient.post<BulkInvitationSendResultDto>(
      `${EMAILS_BASE_PATH}/send-invitations`,
      {
        registrationIds,
        subject,
        body: body || undefined,
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return response.data;
  },

  async downloadRegistrationQrPng(registrationId: number, fileName?: string) {
    const response = await axiosClient.get<Blob>(
      `${EMAILS_BASE_PATH}/registrations/${registrationId}/qr.png`,
      {
        responseType: 'blob',
      }
    );
    const responseFileName =
      extractFileNameFromDisposition(response.headers['content-disposition']) ??
      fileName ??
      `qrkod-${registrationId}.png`;
    triggerFileDownload(response.data, responseFileName);
  },

  async downloadRegistrationTicketPdf(registrationId: number, fileName?: string) {
    const response = await axiosClient.get<Blob>(
      `${EMAILS_BASE_PATH}/registrations/${registrationId}/ticket.pdf`,
      {
        responseType: 'blob',
      }
    );
    const responseFileName =
      extractFileNameFromDisposition(response.headers['content-disposition']) ??
      fileName ??
      `ulaznica-${registrationId}.pdf`;
    triggerFileDownload(response.data, responseFileName);
  },

  async downloadBulkQrArchive(registrationIds: number[], fileName = 'ulaznice-png.zip') {
    const response = await axiosClient.post<Blob>(
      `${EMAILS_BASE_PATH}/downloads/qr.zip`,
      {
        registrationIds,
      },
      {
        headers: await withCsrfHeaders(),
        responseType: 'blob',
      }
    );
    const responseFileName =
      extractFileNameFromDisposition(response.headers['content-disposition']) ?? fileName;
    triggerFileDownload(response.data, responseFileName);
  },

  async downloadBulkPdfArchive(registrationIds: number[], fileName = 'ulaznice-pdf.zip') {
    const response = await axiosClient.post<Blob>(
      `${EMAILS_BASE_PATH}/downloads/pdf.zip`,
      {
        registrationIds,
      },
      {
        headers: await withCsrfHeaders(),
        responseType: 'blob',
      }
    );
    const responseFileName =
      extractFileNameFromDisposition(response.headers['content-disposition']) ?? fileName;
    triggerFileDownload(response.data, responseFileName);
  },

  async checkInRegistration(_eventId: string, registrationId: number) {
    const response = await axiosClient.post<BackendCheckInResponseDto>(
      `${CHECKIN_BASE_PATH}/manual`,
      {
        registrationId,
        manualReason: 'Rucni check-in',
        scannedBy: 'web-user',
        deviceInfo: 'web-admin',
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return response.data;
  },

  async checkInByQrCode(_eventId: string, qrCode: string) {
    const response = await axiosClient.post<BackendCheckInResponseDto>(
      `${CHECKIN_BASE_PATH}/scan`,
      {
        token: qrCode,
        scannedBy: 'web-user',
        deviceInfo: 'web-admin',
      },
      {
        headers: await withCsrfHeaders(),
      }
    );
    return response.data;
  },
};
