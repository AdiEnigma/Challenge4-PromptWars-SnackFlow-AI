import { pool, query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface UserModel {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  name: string;
  language: string;
  notifications_enabled?: boolean;
  assigned_stalls?: string[];
  created_at: string;
  updated_at: string;
}

export class User {
  static async findById(id: string): Promise<UserModel | null> {
    return queryOne<UserModel>('SELECT * FROM users WHERE id = $1', [id]);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    return queryOne<UserModel>('SELECT * FROM users WHERE email = $1', [email]);
  }

  static async create(data: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
    language?: string;
  }): Promise<UserModel> {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 12);
    const rows = await query<UserModel>(
      `INSERT INTO users (id, email, password_hash, role, name, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.email, passwordHash, data.role, data.name, data.language || 'en']
    );
    return rows[0];
  }

  static async verifyPassword(user: UserModel, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateLanguage(id: string, language: string): Promise<void> {
    await query('UPDATE users SET language = $1, updated_at = NOW() WHERE id = $2', [language, id]);
  }

  static async findAll(role?: UserRole): Promise<UserModel[]> {
    if (role) {
      return query<UserModel>('SELECT * FROM users WHERE role = $1', [role]);
    }
    return query<UserModel>('SELECT * FROM users');
  }

  static async updateNotifications(id: string, enabled: boolean): Promise<void> {
    await query('UPDATE users SET notifications_enabled = $1 WHERE id = $2', [enabled, id]);
  }
}
