import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const tokenData = decoded as { id: string; email: string };
      const user = await prisma.user.findUnique({
        where: { id: tokenData.id },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      req.user = { id: user.id, email: user.email, role: user.role };
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without authentication
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET!, async (err, decoded) => {
    if (err) {
      // Invalid token, continue without authentication
      return next();
    }

    try {
      const tokenData = decoded as { id: string; email: string };
      const user = await prisma.user.findUnique({
        where: { id: tokenData.id },
        select: { id: true, email: true, role: true },
      });

      if (user) {
        req.user = { id: user.id, email: user.email, role: user.role };
      }

      next();
    } catch (error) {
      // Error occurred, continue without authentication
      next();
    }
  });
};
