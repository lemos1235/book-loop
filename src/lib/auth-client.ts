import { createAuthClient } from 'better-auth/client';

/** 浏览器端与同源 /api/auth/* 通信，无需显式 baseURL */
export const authClient = createAuthClient();
