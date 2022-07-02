import { db } from './db.server';
import bcrypt from 'bcryptjs';

export const login = async (username: string, password: string) => {
  const user = await db.user.findUnique({ where: { username } });

  if (!user) return null;

  // compare password
  const isPassCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPassCorrect) return null;

  return { id: user.id, username };
};
