/// <reference types="vite/client" />
import type { User as BetterAuthUser, Session } from 'better-auth';

declare global {
  namespace App {
    interface User extends BetterAuthUser {}

    interface Locals {
      user?: User;
      session?: Session;
    }
  }
}

export {};
