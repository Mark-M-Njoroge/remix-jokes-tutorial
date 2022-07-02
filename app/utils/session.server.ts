import { db } from './db.server';
import bcrypt from 'bcryptjs';
import { env } from 'process';
import { randomBytes } from 'crypto';
import { createCookieSessionStorage, redirect } from '@remix-run/node';

export const generateRandomString = () => {
  const randomString = randomBytes(32).toString('hex');

  return randomString;
};

export const login = async (username: string, password: string) => {
  const user = await db.user.findUnique({ where: { username } });

  if (!user) return null;

  // compare password
  const isPassCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPassCorrect) return null;

  return { id: user.id, username };
};

//// CREATE COOKIE SESSION
const sessionSecret = env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

// Create Session
const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    secure: env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'strict',
    path: '/',
    maxAge: Number(env.COOKIE_EXPIRES_IN),
    httpOnly: true,
  },
});

export const createUserSession = async (userId: string, redirectTo: string) => {
  const session = await storage.getSession();

  session.set('userId', userId);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
};
