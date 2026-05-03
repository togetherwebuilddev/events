import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8081',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});
