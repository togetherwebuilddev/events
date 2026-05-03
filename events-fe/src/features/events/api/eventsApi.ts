import { axiosClient } from '../../../api/client/axiosClient';
import {
  CreateEventRequest,
  EventDto,
  PaginatedResponse,
  UpdateEventRequest,
} from '../types/event';

const EVENTS_BASE_PATH = '/api/admin/events';
const AUTH_BASE_PATH = '/api/auth';

type BackendPaginatedResponse<T> = {
  content?: T[];
  items?: T[];
  number?: number;
  page?: number;
  size?: number;
  totalElements?: number;
  totalItems?: number;
  totalPages?: number;
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

function normalizePaginatedResponse<T>(
  response: BackendPaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    items: response.items ?? response.content ?? [],
    page: response.page ?? response.number ?? 0,
    size: response.size ?? 10,
    totalItems: response.totalItems ?? response.totalElements ?? 0,
    totalPages: response.totalPages ?? 0,
  };
}

export const eventsApi = {
  async getEvents(page: number, size: number, search?: string) {
    const response = await axiosClient.get<BackendPaginatedResponse<EventDto>>(EVENTS_BASE_PATH, {
      params: {
        page,
        size,
        search: search?.trim() || undefined,
      },
    });
    return normalizePaginatedResponse(response.data);
  },

  async getEvent(id: string) {
    const response = await axiosClient.get<EventDto>(`${EVENTS_BASE_PATH}/${id}`);
    return response.data;
  },

  async createEvent(payload: CreateEventRequest) {
    const response = await axiosClient.post<EventDto>(EVENTS_BASE_PATH, payload, {
      headers: await withCsrfHeaders(),
    });
    return response.data;
  },

  async updateEvent(id: string, payload: UpdateEventRequest) {
    const response = await axiosClient.put<EventDto>(`${EVENTS_BASE_PATH}/${id}`, payload, {
      headers: await withCsrfHeaders(),
    });
    return response.data;
  },

  async deleteEvent(id: number) {
    await axiosClient.delete(`${EVENTS_BASE_PATH}/${id}`, {
      headers: await withCsrfHeaders(),
    });
  },
};
