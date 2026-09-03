import {
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'crypto';

import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

export async function hashPassword(
  password: string,
): Promise<string> {
  if (!password) {
    throw new Error(
      'Password is required for hashing.',
    );
  }

  const salt = randomBytes(16).toString('hex');

  const derivedKey = (await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  try {
    const parts = storedHash.split('$');

    if (parts.length !== 3) {
      return false;
    }

    const [
      algorithm,
      salt,
      hashHex,
    ] = parts;

    if (
      algorithm !== 'scrypt' ||
      !salt ||
      !hashHex
    ) {
      return false;
    }

    const storedKey = Buffer.from(
      hashHex,
      'hex',
    );

    if (!storedKey.length) {
      return false;
    }

    const derivedKey = (await scryptAsync(
      password,
      salt,
      storedKey.length,
    )) as Buffer;

    if (
      storedKey.length !==
      derivedKey.length
    ) {
      return false;
    }

    return timingSafeEqual(
      storedKey,
      derivedKey,
    );
  } catch {
    return false;
  }
}