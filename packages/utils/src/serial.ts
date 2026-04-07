import crypto from 'crypto';

export function serial(): string {
  return crypto.randomBytes(16)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join('-');
}
