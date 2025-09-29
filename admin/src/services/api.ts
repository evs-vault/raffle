import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

export const gamesAPI = {
  getAll: () => api.get('/games'),
  getById: (id: string) => api.get(`/games/${id}`),
  create: (data: any) => api.post('/games', data),
  update: (id: string, data: any) => api.put(`/games/${id}`, data),
  delete: (id: string) => api.delete(`/games/${id}`),
  deleteBulk: (gameIds: string[]) => api.delete('/games/bulk', { data: { gameIds } }),
  start: (id: string) => api.put(`/games/${id}/start`),
  end: (id: string) => api.put(`/games/${id}/end`),
  // Player management
  createPlayer: (gameId: string, data: any) => api.post(`/games/${gameId}/players`, data),
  updatePlayer: (gameId: string, playerId: string, data: any) => api.put(`/games/${gameId}/players/${playerId}`, data),
  deletePlayer: (gameId: string, playerId: string) => api.delete(`/games/${gameId}/players/${playerId}`),
  invitePlayer: (gameId: string, playerId: string) => api.post(`/games/${gameId}/players/${playerId}/invite`),
  assignUsername: (gameId: string, playerId: string, data: any) => api.post(`/games/${gameId}/players/${playerId}/assign-username`, data),
};

export const playersAPI = {
  getAll: () => api.get('/players'),
  getByGame: (gameId: string) => api.get(`/players/${gameId}/players`),
  add: (gameId: string, data: any) => api.post(`/players/${gameId}/players`, data),
  update: (gameId: string, playerId: string, data: any) =>
    api.put(`/players/${gameId}/players/${playerId}`, data),
  delete: (gameId: string, playerId: string) =>
    api.delete(`/players/${gameId}/players/${playerId}`),
  setWinner: (gameId: string, playerId: string) =>
    api.post(`/players/${gameId}/players/${playerId}/winner`),
};

export default api;

