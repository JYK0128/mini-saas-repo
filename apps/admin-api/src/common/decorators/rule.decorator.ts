import { SetMetadata } from '@nestjs/common';

import { OrganizationType, RoleType } from '@/entities';

export const RULE_KEY = 'rule';

export interface RuleMetadata {
  scope: OrganizationType | OrganizationType[]
  roles: RoleType[]
}

/**
 * @Rule(OrganizationType.PLATFORM, RoleType.ADMIN)
 * @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], RoleType.OWNER)
 */
export const Rule = (scope: OrganizationType | OrganizationType[], roles: RoleType | RoleType[]) =>
  SetMetadata(RULE_KEY, {
    scope,
    roles: Array.isArray(roles) ? roles : [roles],
  });
