import type { FilterQuery, FindOneOptions } from '@mikro-orm/core';

import { CoreRepository } from '../_common/core.repository';
import { ProviderType } from '../account/account.entity';
import type { User } from './user.entity';

export class UserRepository extends CoreRepository<User> {
  async findByEmail({ email }: Pick<User, 'email'>) {
    return this.findOne({ email });
  }

  async findCredentialUser(user: FilterQuery<User>, options?: FindOneOptions<User>) {
    return this.findOne({
      $and: [
        user,
        { account: { providerId: ProviderType.CREDENTIAL } },
      ],
    }, options);
  }
}
