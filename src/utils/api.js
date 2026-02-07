import axios from "axios";

// Get API base URL from environment variables
// For Render, this will be set to the backend service URL
// For local development, defaults to localhost:5000
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL;

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("employee");
      // Optionally redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
