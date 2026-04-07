import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * DB의 Permission 테이블에 등록된 permission 문자열과 대조하여 접근 제어합니다.
 * 배열로 전달할 경우 모든 권한을 가지고 있어야 합니다 (AND 조건).
 *
 * @example
 * @Permissions('dashboard:read')
 * @Permissions(['dashboard:read', 'dashboard:write'])
 */
export const Permissions = (permissions: string | string[]) =>
  SetMetadata(PERMISSION_KEY, Array.isArray(permissions) ? permissions : [permissions]);
