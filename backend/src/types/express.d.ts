import express from 'express';
import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
      io?: Server;
    }
  }
}
