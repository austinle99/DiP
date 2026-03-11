import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw AppError.badRequest('Email already registered', 'EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return { userId: user.id, email: user.email, name: user.name, role: user.role };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw AppError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid email or password');

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  return {
    token,
    user: { userId: user.id, email: user.email, name: user.name, role: user.role },
  };
}
