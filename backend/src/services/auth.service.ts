import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { ENV } from '../config/env';
import { Role } from '@prisma/client';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
    organization?: string;
    department?: string;
    designation?: string;
    phone?: string;
  }) {
    const existing = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const assignedRole = data.role || Role.TRAINEE;

    // Auto-approve trainee in dev/demo or make pending based on role
    const initialStatus = assignedRole === Role.TRAINEE ? 'APPROVED' : 'PENDING';

    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        fullName: data.fullName,
        role: assignedRole,
        status: initialStatus,
        organization: data.organization,
        department: data.department,
        designation: data.designation,
        phone: data.phone,
        profile: {
          create: {
            interests: [],
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        organization: true,
        department: true,
        designation: true,
      },
    });

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    return { user, ...tokens };
  }

  static async login(data: { email: string; password: string }) {
    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      throw new Error('Your account has been suspended. Please contact administrator.');
    }

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        organization: user.organization,
        department: user.department,
        designation: user.designation,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  static generateTokens(payload: { id: string; email: string; role: Role; fullName: string }) {
    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '1d', // 1 day access token
    });

    const refreshToken = jwt.sign({ id: payload.id }, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { id: string };
      const user = await db.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async getCurrentUser(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        trainerSkills: {
          include: { skill: true },
        },
        traineeSkills: {
          include: { skill: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
