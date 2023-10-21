declare module 'express-session' {
  interface SessionData {
    passport: { user: string };
  }
}

export {};
