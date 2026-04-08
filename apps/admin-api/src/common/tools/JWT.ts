import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-256-bit-secret-here-at-least-32-chars-long',
);

/**
 * 초대장 토큰 생성
 */
export async function signInvitationToken(payload: { invitationId: string, email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * 초대장 토큰 검증
 */
export async function verifyInvitationToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as { invitationId: string, email: string };
  }
  catch {
    return null;
  }
}

/**
 * 이메일 인증 토큰 생성
 */
export async function signEmailToken(payload: { email: string, token: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(JWT_SECRET);
}

/**
 * 이메일 인증 토큰 검증
 */
export async function verifyEmailToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as { email: string, token: string };
  }
  catch {
    return null;
  }
}
