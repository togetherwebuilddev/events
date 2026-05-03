import { axiosClient } from '../../../api/client/axiosClient';
import { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

const AUTH_BASE_PATH = '/api/auth';

type CsrfResponse = {
  token: string;
};

async function withCsrfHeaders() {
  const response = await axiosClient.get<CsrfResponse>(`${AUTH_BASE_PATH}/csrf`);

  return {
    'X-XSRF-TOKEN': response.data.token,
  };
}

export const authApi = {
  async fetchCsrfToken() {
    const response = await axiosClient.get<CsrfResponse>(`${AUTH_BASE_PATH}/csrf`);
    return response.data.token;
  },

  async login(payload: LoginRequest) {
    const response = await axiosClient.post<AuthUser>(`${AUTH_BASE_PATH}/login`, payload, {
      headers: await withCsrfHeaders(),
    });
    return response.data;
  },

  async register(payload: RegisterRequest) {
    const response = await axiosClient.post<AuthUser>(`${AUTH_BASE_PATH}/register`, payload, {
      headers: await withCsrfHeaders(),
    });
    return response.data;
  },

  async me() {
    const response = await axiosClient.get<AuthUser>(`${AUTH_BASE_PATH}/me`);
    return response.data;
  },

  async logout() {
    await axiosClient.post(
      `${AUTH_BASE_PATH}/logout`,
      {},
      {
        headers: await withCsrfHeaders(),
      }
    );
  },
};
