import { authenticator } from 'otplib';

authenticator.options = {
  step: 30,
  window: 1, // tolerate slight clock skew
};

export function generateTwoFASecret(label: string) {
  const secret = authenticator.generateSecret();
  const issuer = 'Realestate';
  const otpauthUrl = authenticator.keyuri(label || 'user', issuer, secret);
  return { secret, otpauthUrl };
}

export function verifyTwoFAToken(secret: string, token: string): boolean {
  if (!secret || !token) return false;
  const sanitized = token.trim().replace(/\s+/g, '');
  return authenticator.verify({ token: sanitized, secret });
}
