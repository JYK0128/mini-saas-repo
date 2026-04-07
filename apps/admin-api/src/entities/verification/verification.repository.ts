import { CoreRepository } from '../_common/core.repository';
import type { Verification } from './verification.entity';

export class VerificationRepository extends CoreRepository<Verification> {
  /**
   * 인증 정보를 생성합니다.
   * @param identifier 인증 식별자
   * @param secret 인증 값
   * @param expires 인증 만료 시간(ms)
   */
  createVerification(
    identifier: string,
    secret: string,
    expires: number,
  ) {
    return this.create({
      identifier,
      value: secret,
      expiresAt: new Date(Date.now() + expires),
      throttleKey: `${identifier}:${Math.floor(Date.now() / (60 * 1000))}`,
    }).persist();
  }

  /**
   * 식별자(이메일, 휴대폰 번호 등)와 인증 값(토큰, OTP 등)으로 유효한 인증 정보를 조회합니다.
   * @param identifier 인증 식별자
   */
  findActiveVerification(identifier: string) {
    return this.findOne(
      { identifier, expiresAt: { $gt: new Date() } },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
