import axios from 'axios';

const TOKEN_KEY = 'mossnote_token';

const api = axios.create({ baseURL: '/api' });

// 自动带上 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 统一取出 { error: { message } } 里的提示
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export default api;
