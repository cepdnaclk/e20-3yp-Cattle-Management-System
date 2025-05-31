import axios from 'axios';

// Base URL for the API
const BASE_URL = "http://localhost:5010";


export default axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
