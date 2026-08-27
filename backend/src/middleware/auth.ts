import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { db } from '../config/db';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthenticatedUser;
    
    // Check if user still exists and is not suspended
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, fullName: true, status: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User no longer exists' });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      res.status(403).json({ success: false, error: 'Account is suspended or deactivated' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired access token' });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
