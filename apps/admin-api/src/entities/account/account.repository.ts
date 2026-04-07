import { CoreRepository } from '../_common/core.repository';
import { type Account, ProviderType } from './account.entity';

export class AccountRepository extends CoreRepository<Account> {
  findByEmail(accountId: string) {
    return this.findOne(
      { accountId, providerId: ProviderType.CREDENTIAL },
      { populate: ['user'] },
    );
  }
}
