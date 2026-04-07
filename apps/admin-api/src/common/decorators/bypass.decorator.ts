import { SetMetadata } from '@nestjs/common';

export type AuthCondition = 'twoFactorPending' | 'needsTermAgreement' | 'emailVerified' | 'member' | 'organization';

export const BYPASS_KEY = 'bypass';
export const Bypass = (...conditions: AuthCondition[]) => SetMetadata(BYPASS_KEY, conditions);
