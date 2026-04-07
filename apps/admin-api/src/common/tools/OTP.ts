import { generate, generateSecret } from 'otplib';

export async function generateOtp() {
  const secret = generateSecret();
  const token = await generate({ secret });

  return { secret, token };
}
