import { promisify } from 'util';
import {
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'crypto';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

export async function hashPassword(
  password: string,
): Promise<string> {
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
  const [algorithm, salt, hashHex] =
    storedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    !salt ||
    !hashHex
  ) {
    return false;
  }

  const storedKey = Buffer.from(hashHex, 'hex');

  const derivedKey = (await scryptAsync(
    password,
    salt,
    storedKey.length,
  )) as Buffer;

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(
    storedKey,
    derivedKey,
  );
}