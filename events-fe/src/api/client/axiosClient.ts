import axios from 'axios';

const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
const baseURL = configuredBaseUrl ? configuredBaseUrl : undefined;

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});
