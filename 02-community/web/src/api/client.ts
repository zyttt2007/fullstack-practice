import axios from 'axios';

const TOKEN_KEY = 'hearthask_token';

const api = axios.create({ baseURL: `${import.meta.env.BASE_URL}api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // 同时放在头与查询参数里：部分托管环境的代理会覆盖 Authorization 头，
    // 后端按 X-Access-Token → token 参数 → Authorization 的顺序取值
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Access-Token'] = token;
    config.params = { ...(config.params || {}), token };
  }
  return config;
});

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
