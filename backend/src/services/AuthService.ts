import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, UserModel } from '../models/User';
import { LoginResult, TokenResult, UserRole, JwtPayload } from '../types';
import { redis, cacheGet, cacheSet, cacheDel } from '../config/redis';
import { logger } from '../config/logger';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    preferredLanguage?: string;
  }): Promise<LoginResult> {
    const existing = await User.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      role: data.role,
      name: data.name,
      language: data.preferredLanguage || 'en',
    });

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresIn = 900; // 15 min in seconds

    await this.storeSession(user.id, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.language,
      },
      token,
      refreshToken,
      expiresIn,
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await User.verifyPassword(user, password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresIn = 900;

    await this.storeSession(user.id, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.language,
      },
      token,
      refreshToken,
      expiresIn,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateAccessToken(user);
      return { token, expiresIn: 900 };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async verifyToken(token: string): Promise<UserModel> {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async logout(userId: string): Promise<void> {
    await cacheDel(`session:${userId}`);
    logger.info('User logged out', { userId });
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.language,
      createdAt: user.created_at,
    };
  }

  private generateAccessToken(user: UserModel): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: 900 } as jwt.SignOptions
    );
  }

  private generateRefreshToken(user: UserModel): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.refreshSecret,
      { expiresIn: 604800 } as jwt.SignOptions
    );
  }

  private async storeSession(userId: string, data: any): Promise<void> {
    await cacheSet(`session:${userId}`, data, 28800); // 8 hours
  }
}
