import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 15173,
  },
  preview: {
    port: 15173,
  },
  // bits-ui 以 .svelte 源码分发，服务端必须打包而不是交给 Node 直接 import
  ssr: {
    noExternal: ['bits-ui'],
  },
  plugins: [tailwindcss(), sveltekit()],
});
