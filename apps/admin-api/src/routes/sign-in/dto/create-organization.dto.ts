import { PickType } from '@nestjs/swagger';
import { Length } from 'class-validator';

import { Organization } from '@/entities';

export class CreateOrganizationDto
  extends PickType(Organization, ['name']) {
  @Length(1)
  override name!: string;
}
