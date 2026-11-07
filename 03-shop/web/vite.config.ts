import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 子路径部署用：APP_BASE=blog 时资源与路由挂到 /blog/ 下；不设置则仍是根路径
  base: process.env.APP_BASE ? `/${process.env.APP_BASE}/` : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:4003',
    },
  },
});
